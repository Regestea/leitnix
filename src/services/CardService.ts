import { fetchStructuredAIByModelId } from "./aiModelClient";
import {
  NONE_PROMPT_VALUE,
} from "../statics/prompts";
import {
  TopicType,
  TOPIC_SYSTEM_PROMPTS,
} from "../statics/topicPrompts";
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
  QuestionType,
} from "../features/addCard/types";
import { cardRepository } from "../repositories/CardRepository";
import type { ICardRepository } from "../iRepositories/ICardRepository.ts";
import { questionRepository } from "../repositories/QuestionRepository";
import type { IQuestionRepository } from "../iRepositories/IQuestionRepository.ts";
import { customPromptRepository } from "../repositories/CustomPromptRepository";
import type { ICustomPromptRepository } from "../iRepositories/ICustomPromptRepository.ts";

function buildCardPrompt(card: GeneratedCardData): string {
  return `Topic:\n${card.topic}\n\nContent:\n${card.markdownContent}`;
}

function buildQuestionPrompt(questionTypes: readonly QuestionType[]): string {
  const typeDescriptions: Record<QuestionType, string> = {
    freeResponse: "free-response (question and answer pairs)",
    fillTheBlank: "fill-in-the-blank (question and answer pairs)",
    multipleChoice: "multiple-choice (with 4 options A-D and the correct answer)",
  };

  const count = questionTypes.length;
  let instructions: string;

  if (count === 3) {
    instructions = questionTypes
      .map((t) => `- 6 ${typeDescriptions[t]}`)
      .join("\n");
  } else if (count === 2) {
    instructions = `- 5 ${typeDescriptions[questionTypes[0]]}\n- 4 ${typeDescriptions[questionTypes[1]]}`;
  } else {
    instructions = `- 18 ${typeDescriptions[questionTypes[0]]}`;
  }

  return `You are an expert question generator. Given a flashcard topic and its study content, generate assessment questions.

Requirements:
${instructions}

Return ALL three arrays in the response. For any question type not listed above, include an empty array.`;
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

// ... existing imports

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

  /** Step 2: generate questions from an existing card. */
  async generateQuestions(
    aiModelId: string,
    card: GeneratedCardData,
    questionTypes: readonly QuestionType[],
  ): Promise<QuestionsResponse> {
    try {
      return await fetchStructuredAIByModelId<QuestionsResponse>({
        modelId: aiModelId,
        schema: questionsResponseSchema,
        prompt: buildCardPrompt(card),
        systemPrompt: buildQuestionPrompt(questionTypes),
      });
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to generate questions"), {
        cause: err,
      });
    }
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
          AskedTimes:0
        })),
      );

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
    );
    return this.saveCard({ ...request, questions });
  }
}

export const cardService: ICardService = new CardService();
