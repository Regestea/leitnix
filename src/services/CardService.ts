import { fetchStructuredAIByModelId } from "./aiModelClient";
import {
  QUESTION_GENERATION_SYSTEM_PROMPT,
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
} from "../features/addCard/types";
import { cardRepository } from "../repositories/CardRepository";
import type { ICardRepository } from "../iRepositories/ICardRepository.ts";
import { questionRepository } from "../repositories/QuestionRepository";
import type { IQuestionRepository } from "../iRepositories/IQuestionRepository.ts";
import { customPromptRepository } from "../repositories/CustomPromptRepository";
import type { ICustomPromptRepository } from "../iRepositories/ICustomPromptRepository.ts";

function buildCardPrompt(card: GeneratedCardData): string {
  return `Topic:\n${card.topicMarkdown}\n\nContent:\n${card.markdownContent}`;
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
export class CardService {
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
        topicMarkdown: response.topicMarkdown,
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
  ): Promise<QuestionsResponse> {
    try {
      return await fetchStructuredAIByModelId<QuestionsResponse>({
        modelId: aiModelId,
        schema: questionsResponseSchema,
        prompt: buildCardPrompt(card),
        systemPrompt: QUESTION_GENERATION_SYSTEM_PROMPT,
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
        MarkdownTopic: card.topicMarkdown,
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
        })),
      );

      await this.questionRepo.createFillTheBlankQuestions(
        questions.fillTheBlankQuestions.map((q) => ({
          Id: crypto.randomUUID(),
          CardId: cardId,
          MarkdownQuestion: q.markdownQuestion,
          MarkdownAnswer: q.markdownAnswer,
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
  async generateQuestionsAndSave(request: SaveCardRequest): Promise<string> {
    const questions = await this.generateQuestions(
      request.aiModelId,
      request.card,
    );
    return this.saveCard({ ...request, questions });
  }
}
