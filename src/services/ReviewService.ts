import { cardRepository } from "../repositories/CardRepository";
import type { ICardRepository } from "../iRepositories/ICardRepository.ts";
import { boxRepository } from "../repositories/BoxRepository";
import type { IBoxRepository } from "../iRepositories/IBoxRepository.ts";
import { settingRepository } from "../repositories/SettingRepository";
import type { ISettingRepository } from "../iRepositories/ISettingRepository.ts";
import type { WrongAnswerPunishment } from "../db/entities.ts";

function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * ReviewService owns the business logic for learning and reviewing cards:
 *  - Activates pending cards (Start Learning / I Know It).
 *  - Advances cards between boxes on correct/incorrect reviews.
 */
import type { IReviewService } from "./IReviewService";

// ... existing imports

export class ReviewService implements IReviewService {
  private cardRepo: ICardRepository = cardRepository;
  private boxRepo: IBoxRepository = boxRepository;
  private settingRepo: ISettingRepository = settingRepository;

  /** Activate a pending card into Box 1 (Start Learning). */
  async startLearning(cardId: string): Promise<void> {
    const box1 = await this.boxRepo.getFirst();
    if (!box1) throw new Error("No boxes configured.");
    if (box1.RepeatIntervalSeconds == null) throw new Error("Box 1 has no repeat interval.");

    const now = nowUnix();
    await this.cardRepo.startLearning(
      cardId,
      box1.Id,
      now,
      box1.RepeatIntervalSeconds,
    );
  }

  /** Move a pending card directly to the Finish box (Already Know). */
  async markAsKnown(cardId: string): Promise<void> {
    const finishBox = await this.boxRepo.getFinish();
    if (!finishBox) throw new Error("No finish box found.");

    const now = nowUnix();
    await this.cardRepo.markAsKnown(cardId, finishBox.Id, now);
  }

  /**
   * Record a review result for an active card.
   * Correct  → advance to NextBox (or Finish if already last).
   * Incorrect → apply WrongAnswerPunishment policy.
   */
  async recordReview(cardId: string, correct: boolean): Promise<void> {
    const card = await this.cardRepo.getById(cardId);
    if (!card || !card.BoxId) throw new Error("Card not found or not yet activated.");

    const currentBox = await this.boxRepo.getById(card.BoxId);
    if (!currentBox) throw new Error("Current box not found.");

    const now = nowUnix();

    if (correct) {
      const destBox = currentBox.NextBoxId
        ? await this.boxRepo.getById(currentBox.NextBoxId)
        : null;
      // If no next box (already at finish), stay put
      if (!destBox) return;

      await this.cardRepo.startLearning(
        cardId,
        destBox.Id,
        now,
        destBox.RepeatIntervalSeconds ?? 0,
      );
    } else {
      const destinationBoxId = await this.resolvePunishmentDestination(
        currentBox,
        await this.settingRepo.get(),
      );

      const destBox = await this.boxRepo.getById(destinationBoxId);
      if (!destBox) throw new Error("Destination box not found.");

      await this.cardRepo.startLearning(
        cardId,
        destBox.Id,
        now,
        destBox.RepeatIntervalSeconds ?? 0,
      );
    }
  }

  private async resolvePunishmentDestination(
    currentBox: { Id: string; PreviousBoxId: string | null },
    setting: { WrongAnswerPunishment: WrongAnswerPunishment } | null,
  ): Promise<string> {
    const punishment = setting?.WrongAnswerPunishment ?? "None";

    switch (punishment) {
      case "JumpOneBoxBack":
        if (currentBox.PreviousBoxId) return currentBox.PreviousBoxId;
        return currentBox.Id; // already at first box, stay
      case "JumpToFirstBox": {
        const first = await this.boxRepo.getFirst();
        return first?.Id ?? currentBox.Id;
      }
      case "None":
      default:
        return currentBox.Id; // stay in current box
    }
  }
}

export const reviewService: IReviewService = new ReviewService();
