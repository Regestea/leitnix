import { fetchStructuredAIByModelId } from "../../../services/aiModelClient";
import {
  NONE_PROMPT_VALUE,
} from "../types";
import {
  TopicType,
  TOPIC_SYSTEM_PROMPTS,
} from "../topicPrompts";
import {
  cardNotesResponseSchema,
  freeResponseQuestionsSchema,
  fillTheBlankQuestionsSchema,
  multipleChoiceQuestionsSchema,
} from "../types";
import type {
  CardNotesResponse,
  QuestionsResponse,
  FreeResponseQuestionsResponse,
  FillTheBlankQuestionsResponse,
  MultipleChoiceQuestionsResponse,
  GeneratedCardData,
  GenerateCardRequest,
  SaveCardRequest,
  QuestionType,
} from "../types";
import { isValidMultipleChoiceOption } from "../../../db/entities";
import { buildQuestionCounts, buildQuestionPrompt } from "../questionPrompts";
import { cardRepository } from "../../../repositories/CardRepository";
import type { ICardRepository } from "../../../repositories/CardRepository.ts";
import { questionRepository } from "../../../repositories/QuestionRepository";
import type { IQuestionRepository } from "../../../repositories/QuestionRepository.ts";
import { customPromptRepository } from "../../../repositories/CustomPromptRepository";
import type { ICustomPromptRepository } from "../../../repositories/CustomPromptRepository.ts";

function buildCardPrompt(card: GeneratedCardData): string {
  return `Topic:\n${card.topic}\n\nContent:\n${card.markdownContent}`;
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

async function resolveSystemPrompt(
  topicType: TopicType,
  customPromptId: string,
  topicText: string,
): Promise<string> {
  // 1. Base prompt from the selected topic
  const basePrompt = TOPIC_SYSTEM_PROMPTS[topicType] ?? TOPIC_SYSTEM_PROMPTS[TopicType.Custom];

  // 2. Inject the user's topic into a clearly labeled section
  const topicBlock = `<user_topic>\n${topicText.trim()}\n</user_topic>`;

  // 3. If no custom prompt, return base + user topic only
  if (!customPromptId || customPromptId === NONE_PROMPT_VALUE) {
    return `${basePrompt}\n\n${topicBlock}`;
  }

  // 4. Fetch the saved custom prompt and put it in its own labeled section
  const promptRepo: ICustomPromptRepository = customPromptRepository;
  const customPrompt = await promptRepo.getById(customPromptId);
  if (!customPrompt?.Prompt) {
    return `${basePrompt}\n\n${topicBlock}`;
  }

  const customBlock = `<custom_instructions>\n${customPrompt.Prompt.trim()}\n</custom_instructions>`;
  return `${basePrompt}\n\n${topicBlock}\n\n${customBlock}`;
}

/**
 * CardService owns the card business logic:
 *  - Generates card content via the AI client.
 *  - Generates questions via the AI client.
 *  - Persists cards and questions using repositories.
 * Components call this service for any write/AI operation and use
 * repositories only for read operations (e.g. loading select options).
 */
import type { ICardService } from "./ICardService";

export class CardService implements ICardService {
  private cardRepo: ICardRepository = cardRepository;
  private questionRepo: IQuestionRepository = questionRepository;

  /** Step 1: generate the card topic + notes from a topic prompt. */
  async generateCard(request: GenerateCardRequest): Promise<GeneratedCardData> {
    try {
      const systemPrompt = await resolveSystemPrompt(
        request.topicType,
        request.customPromptId,
        request.topicText,
      );

      const response = await fetchStructuredAIByModelId<CardNotesResponse>({
        modelId: request.aiModelId,
        schema: cardNotesResponseSchema,
        prompt: "Generate the educational pamphlet described in the system prompt for the topic in <user_topic>.",
        systemPrompt,
        images: request.images,
      });

      return {
        topic: response.topic,
        markdownContent: response.markdownContent,
      };
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to generate card"), {
        cause: err,
      });
    }
  }

  /** Step 2: generate questions from an existing card, one dedicated AI call per type. */
  async generateQuestions(
    aiModelId: string,
    card: GeneratedCardData,
    questionTypes: readonly QuestionType[],
    topicType: TopicType,
  ): Promise<QuestionsResponse> {
    const counts = buildQuestionCounts(questionTypes);
    const cardPrompt = buildCardPrompt(card);
    const results: QuestionsResponse = {
      freeResponseQuestions: [],
      fillTheBlankQuestions: [],
      multipleChoiceQuestions: [],
    };

    try {
      for (const type of questionTypes) {
        if (type === "freeResponse") {
          const response = await fetchStructuredAIByModelId<FreeResponseQuestionsResponse>({
            modelId: aiModelId,
            schema: freeResponseQuestionsSchema,
            prompt: cardPrompt,
            systemPrompt: buildQuestionPrompt(topicType, type, counts[type]),
          });
          results.freeResponseQuestions = response.questions;
        } else if (type === "fillTheBlank") {
          const response = await fetchStructuredAIByModelId<FillTheBlankQuestionsResponse>({
            modelId: aiModelId,
            schema: fillTheBlankQuestionsSchema,
            prompt: cardPrompt,
            systemPrompt: buildQuestionPrompt(topicType, type, counts[type]),
          });
          results.fillTheBlankQuestions = response.questions;
        } else {
          const response = await fetchStructuredAIByModelId<MultipleChoiceQuestionsResponse>({
            modelId: aiModelId,
            schema: multipleChoiceQuestionsSchema,
            prompt: cardPrompt,
            systemPrompt: buildQuestionPrompt(topicType, type, counts[type]),
          });
          results.multipleChoiceQuestions = response.questions;
        }
      }
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to generate questions"), {
        cause: err,
      });
    }

    return results;
  }

  /** Persist the card and all generated questions. Returns the card Id. */
  async saveCard(request: SaveCardRequest): Promise<string> {
    try {
      const cardId = crypto.randomUUID();
      const { card, questions, categoryTagId } = request;

      await this.cardRepo.create({
        Id: cardId,
        BoxId: null,
        CategoryTagId: categoryTagId,
        Topic: card.topic,
        MarkdownContent: card.markdownContent,
        LastReviewUnixTime: null,
        NextReviewUnixTime: null,
        StartedLearningUnixTime: null,
      });

      await this.questionRepo.createFreeResponseQuestions(
        questions.freeResponseQuestions.map((q) => ({
          Id: crypto.randomUUID(),
          CardId: cardId,
          MarkdownQuestion: q.markdownQuestion,
          MarkdownAnswer: q.markdownAnswer,
          AskedTimes:0
        })),
      );

      await this.questionRepo.createFillTheBlankQuestions(
        questions.fillTheBlankQuestions.map((q) => ({
          Id: crypto.randomUUID(),
          CardId: cardId,
          MarkdownQuestion: q.markdownQuestion,
          MarkdownAnswer: q.markdownAnswer,
          AskedTimes:0
        })),
      );

      const mcqRows = questions.multipleChoiceQuestions.map((q) => {
        if (!isValidMultipleChoiceOption(q.correctOption)) {
          throw new Error(
            `Invalid CorrectOption value "${q.correctOption}" — must be one of A, B, C, or D`,
          );
        }
        return {
          Id: crypto.randomUUID(),
          CardId: cardId,
          MarkdownQuestion: q.markdownQuestion,
          MarkdownOptionA: q.markdownOptionA,
          MarkdownOptionB: q.markdownOptionB,
          MarkdownOptionC: q.markdownOptionC,
          MarkdownOptionD: q.markdownOptionD,
          CorrectOption: q.correctOption,
          AskedTimes: 0,
        };
      });

      await this.questionRepo.createMultipleChoiceQuestions(mcqRows);

      return cardId;
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to save card"), {
        cause: err,
      });
    }
  }

  /** Convenience: generate questions for a card and persist everything in one flow. */
  async generateQuestionsAndSave(request: SaveCardRequest, questionTypes: readonly QuestionType[]): Promise<string> {
    const questions = await this.generateQuestions(
      request.aiModelId,
      request.card,
      questionTypes,
      request.topicType,
    );
    return this.saveCard({ ...request, questions });
  }
}

export const cardService: ICardService = new CardService();
