import { fetchStructuredAIByModelId } from "./aiModelClient";
import {
  CARD_GENERATION_SYSTEM_PROMPT,
  QUESTION_GENERATION_SYSTEM_PROMPT,
  NONE_PROMPT_VALUE,
} from "../statics/prompts";
import {
  cardNotesResponseSchema,
  questionsResponseSchema,
} from "../features/addCard/types";
import type {
  CardNotesResponse,
  QuestionsResponse,
  GeneratedCardData,
  GenerateCardRequest,
  SaveCardRequest,
} from "../features/addCard/types";
import { CardRepository } from "../features/addCard/repository/CardRepository";
import { NoteRepository } from "../features/addCard/repository/NoteRepository";
import { QuestionRepository } from "../features/addCard/repository/QuestionRepository";
import { CustomPromptRepository } from "../features/customPrompt/repository/CustomPromptRepository";

function buildCardPrompt(card: GeneratedCardData): string {
  const notesText = card.notes
    .map((note, i) => `Note ${i + 1}:\n${note}`)
    .join("\n\n");
  return `Topic:\n${card.topicMarkdown}\n\nNotes:\n${notesText}`;
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

async function resolveSystemPrompt(
  customPromptId: string,
  fallback: string
): Promise<string> {
  if (!customPromptId || customPromptId === NONE_PROMPT_VALUE) return fallback;

  const promptRepo = new CustomPromptRepository();
  const customPrompt = await promptRepo.getById(customPromptId);
  return customPrompt?.Prompt ?? fallback;
}

/**
 * CardService owns the card business logic:
 *  - Generates card content via the AI client.
 *  - Generates questions via the AI client.
 *  - Persists cards, notes and questions using repositories.
 * Components call this service for any write/AI operation and use
 * repositories only for read operations (e.g. loading select options).
 */
export class CardService {
  private cardRepo = new CardRepository();
  private noteRepo = new NoteRepository();
  private questionRepo = new QuestionRepository();

  /** Step 1: generate the card topic + notes from a topic prompt. */
  async generateCard(
    request: GenerateCardRequest
  ): Promise<GeneratedCardData> {
    try {
      const systemPrompt = await resolveSystemPrompt(
        request.customPromptId,
        CARD_GENERATION_SYSTEM_PROMPT
      );

      const response = await fetchStructuredAIByModelId<CardNotesResponse>({
        modelId: request.aiModelId,
        schema: cardNotesResponseSchema,
        prompt: request.topicText,
        systemPrompt,
      });

      return {
        topicMarkdown: response.topicMarkdown,
        notes: response.notes.map((n) => n.markdownContent),
      };
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to generate card"));
    }
  }

  /** Step 2: generate questions from an existing card. */
  async generateQuestions(
    aiModelId: string,
    card: GeneratedCardData
  ): Promise<QuestionsResponse> {
    try {
      return await fetchStructuredAIByModelId<QuestionsResponse>({
        modelId: aiModelId,
        schema: questionsResponseSchema,
        prompt: buildCardPrompt(card),
        systemPrompt: QUESTION_GENERATION_SYSTEM_PROMPT,
      });
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to generate questions"));
    }
  }

  /** Persist the card, its notes and all generated questions. Returns the card Id. */
  async saveCard(request: SaveCardRequest): Promise<string> {
    try {
      const firstBoxId = await this.cardRepo.getFirstBoxId();
      if (!firstBoxId) {
        throw new Error("No box found. Please set up boxes first.");
      }

      const cardId = crypto.randomUUID();
      const now = Date.now();
      const { card, questions, categoryTagId } = request;

      await this.cardRepo.create({
        Id: cardId,
        BoxId: firstBoxId,
        CategoryTagId: categoryTagId,
        MarkdownTopic: card.topicMarkdown,
        LastReviewUnixTime: now,
        NextReviewUnixTime: now,
        StartedLearningUnixTime: now,
      });

      await this.noteRepo.createMany(
        card.notes.map((markdownContent) => ({
          Id: crypto.randomUUID(),
          CardId: cardId,
          MarkdownContent: markdownContent,
        }))
      );

      await this.questionRepo.createFreeResponseQuestions(
        questions.freeResponseQuestions.map((q) => ({
          Id: crypto.randomUUID(),
          CardId: cardId,
          MarkdownQuestion: q.markdownQuestion,
          MarkdownAnswer: q.markdownAnswer,
        }))
      );

      await this.questionRepo.createFillTheBlankQuestions(
        questions.fillTheBlankQuestions.map((q) => ({
          Id: crypto.randomUUID(),
          CardId: cardId,
          MarkdownQuestion: q.markdownQuestion,
          MarkdownAnswer: q.markdownAnswer,
        }))
      );

      await this.questionRepo.createMultipleChoiceQuestions(
        questions.multipleChoiceQuestions.map((q) => ({
          Id: crypto.randomUUID(),
          CardId: cardId,
          MarkdownQuestion: q.markdownQuestion,
          MarkdownOptionA: q.markdownOptionA,
          MarkdownOptionB: q.markdownOptionB,
          MarkdownOptionC: q.markdownOptionC,
          MarkdownOptionD: q.markdownOptionD,
          CorrectOption: q.correctOption,
        }))
      );

      return cardId;
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to save card"));
    }
  }

  /** Convenience: generate questions for a card and persist everything in one flow. */
  async generateQuestionsAndSave(request: SaveCardRequest): Promise<string> {
    const questions = await this.generateQuestions(
      request.aiModelId,
      request.card
    );
    return this.saveCard({ ...request, questions });
  }
}
