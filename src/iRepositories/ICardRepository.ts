import type { Card } from "../db/entities.ts";

export interface ICardRepository {
  create(card: Card): Promise<void>;
  getByCategoryTagId(tagId: string): Promise<Card[]>;
  updateCategoryTagId(cardIds: string[], newTagId: string): Promise<void>;
  getById(id: string): Promise<Card | null>;
  getPendingByTag(tagId: string): Promise<Card[]>;
  getTagPendingCounts(): Promise<Map<string, number>>;
  startLearning(cardId: string, box1Id: string, now: number, intervalMinutes: number): Promise<void>;
  markAsKnown(cardId: string, finishBoxId: string, now: number): Promise<void>;
  countStartedLearningLast24h(now: number): Promise<number>;
  getCardsNeedToReview(tagId:string):Promise<Card[]>;
}
