import { describe, it, expect, beforeEach, vi } from "vitest";
import { TopicType } from "../../src/statics/topicPrompts";

const { mockFetchStructuredAIByModelId } = vi.hoisted(() => ({
  mockFetchStructuredAIByModelId: vi.fn(),
}));

vi.mock("../../src/services/aiModelClient", () => ({
  fetchStructuredAIByModelId: mockFetchStructuredAIByModelId,
}));

const { mockCardRepo, mockQuestionRepo, mockCustomPromptRepo } = vi.hoisted(() => ({
  mockCardRepo: {
    create: vi.fn(),
    getByCategoryTagId: vi.fn(),
    updateCategoryTagId: vi.fn(),
    startLearning: vi.fn(),
    markAsKnown: vi.fn(),
    getCardNeedToReview: vi.fn(),
    countStartedLearningLast24h: vi.fn(),
    overallReviewToday: vi.fn(),
    getById: vi.fn(),
  },
  mockQuestionRepo: {
    createFreeResponseQuestions: vi.fn(),
    createFillTheBlankQuestions: vi.fn(),
    createMultipleChoiceQuestions: vi.fn(),
    getByCardId: vi.fn(),
    deleteByCard: vi.fn(),
  },
  mockCustomPromptRepo: {
    getById: vi.fn(),
    getByName: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../src/repositories/CardRepository", () => ({
  cardRepository: mockCardRepo,
}));

vi.mock("../../src/repositories/QuestionRepository", () => ({
  questionRepository: mockQuestionRepo,
}));

vi.mock("../../src/repositories/CustomPromptRepository", () => ({
  customPromptRepository: mockCustomPromptRepo,
}));

import { CardService } from "../../src/services/CardService";

describe("CardService", () => {
  let service: CardService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CardService();
  });

  describe("generateCard", () => {
    it("returns topic and markdownContent from AI response", async () => {
      mockFetchStructuredAIByModelId.mockResolvedValue({
        topic: "Photosynthesis",
        markdownContent: "# Photosynthesis\n\nPlants convert sunlight...",
      });

      const result = await service.generateCard({
        topicType: TopicType.Science,
        aiModelId: "m1",
        customPromptId: "none",
        topicText: "Photosynthesis",
      });

      expect(result).toEqual({
        topic: "Photosynthesis",
        markdownContent: "# Photosynthesis\n\nPlants convert sunlight...",
      });
    });

    it("passes images to AI client when provided", async () => {
      mockFetchStructuredAIByModelId.mockResolvedValue({
        topic: "Diagram",
        markdownContent: "# Diagram analysis",
      });

      await service.generateCard({
        topicType: TopicType.Science,
        aiModelId: "m1",
        customPromptId: "none",
        topicText: "Analyze this diagram",
        images: ["data:image/png;base64,imgdata"],
      });

      expect(mockFetchStructuredAIByModelId.mock.calls[0][0].images).toEqual([
        "data:image/png;base64,imgdata",
      ]);
    });

    it("re-throws AI error with original message", async () => {
      mockFetchStructuredAIByModelId.mockRejectedValue(new Error("API error"));

      await expect(
        service.generateCard({
          topicType: TopicType.Science,
          aiModelId: "m1",
          customPromptId: "none",
          topicText: "Test",
        }),
      ).rejects.toThrow("API error");
    });

    it("uses custom prompt when customPromptId is provided", async () => {
      mockCustomPromptRepo.getById.mockResolvedValue({
        Id: "cp1",
        Name: "Deep Dive",
        Prompt: "Focus on advanced details and edge cases.",
      });
      mockFetchStructuredAIByModelId.mockResolvedValue({
        topic: "Advanced",
        markdownContent: "# Deep content",
      });

      await service.generateCard({
        topicType: TopicType.Science,
        aiModelId: "m1",
        customPromptId: "cp1",
        topicText: "Quantum computing",
      });

      const systemPrompt =
        mockFetchStructuredAIByModelId.mock.calls[0][0].systemPrompt;
      expect(systemPrompt).toContain("Focus on advanced details");
      expect(systemPrompt).toContain("<custom_instructions>");
      expect(mockCustomPromptRepo.getById).toHaveBeenCalledWith("cp1");
    });
  });

  describe("generateQuestions", () => {
    const card = { topic: "Algebra", markdownContent: "x + y = z" };

    it("returns structured questions from AI response", async () => {
      const aiResponse = {
        freeResponseQuestions: [
          { markdownQuestion: "What is x?", markdownAnswer: "A variable" },
        ],
        fillTheBlankQuestions: [],
        multipleChoiceQuestions: [],
      };
      mockFetchStructuredAIByModelId.mockResolvedValue(aiResponse);

      const result = await service.generateQuestions("m1", card, [
        "freeResponse",
      ]);

      expect(result).toEqual(aiResponse);
    });

    it("re-throws AI error with original message", async () => {
      mockFetchStructuredAIByModelId.mockRejectedValue(new Error("API error"));

      await expect(
        service.generateQuestions("m1", card, ["freeResponse"]),
      ).rejects.toThrow("API error");
    });

    it("includes card content in the prompt", async () => {
      mockFetchStructuredAIByModelId.mockResolvedValue({
        freeResponseQuestions: [],
        fillTheBlankQuestions: [],
        multipleChoiceQuestions: [],
      });

      await service.generateQuestions("m1", card, ["freeResponse"]);

      const prompt = mockFetchStructuredAIByModelId.mock.calls[0][0].prompt;
      expect(prompt).toContain("Algebra");
      expect(prompt).toContain("x + y = z");
    });
  });

  describe("saveCard", () => {
    const saveRequest = {
      aiModelId: "m1",
      categoryTagId: "tag-1",
      card: { topic: "T", markdownContent: "C" },
      questions: {
        freeResponseQuestions: [
          { markdownQuestion: "Q1?", markdownAnswer: "A1" },
        ],
        fillTheBlankQuestions: [
          { markdownQuestion: "FB1", markdownAnswer: "FB_A1" },
        ],
        multipleChoiceQuestions: [
          {
            markdownQuestion: "MC1",
            markdownOptionA: "A",
            markdownOptionB: "B",
            markdownOptionC: "C",
            markdownOptionD: "D",
            correctOption: "B" as const,
          },
        ],
      },
    };

    it("creates card and questions via repositories", async () => {
      mockCardRepo.create.mockResolvedValue(undefined);
      mockQuestionRepo.createFreeResponseQuestions.mockResolvedValue(undefined);
      mockQuestionRepo.createFillTheBlankQuestions.mockResolvedValue(undefined);
      mockQuestionRepo.createMultipleChoiceQuestions.mockResolvedValue(undefined);

      const cardId = await service.saveCard(saveRequest);

      expect(typeof cardId).toBe("string");
      expect(cardId.length).toBeGreaterThan(0);

      expect(mockCardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          Id: cardId,
          CategoryTagId: "tag-1",
          Topic: "T",
          MarkdownContent: "C",
        }),
      );

      expect(
        mockQuestionRepo.createFreeResponseQuestions,
      ).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            CardId: cardId,
            MarkdownQuestion: "Q1?",
            MarkdownAnswer: "A1",
          }),
        ]),
      );

      expect(
        mockQuestionRepo.createFillTheBlankQuestions,
      ).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            CardId: cardId,
            MarkdownQuestion: "FB1",
            MarkdownAnswer: "FB_A1",
          }),
        ]),
      );

      expect(
        mockQuestionRepo.createMultipleChoiceQuestions,
      ).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            CardId: cardId,
            MarkdownQuestion: "MC1",
            CorrectOption: "B",
          }),
        ]),
      );
    });

    it("re-throws repository error with original message", async () => {
      mockCardRepo.create.mockRejectedValue(new Error("DB error"));

      await expect(service.saveCard(saveRequest)).rejects.toThrow("DB error");
    });
  });

  describe("generateQuestionsAndSave", () => {
    const saveRequest = {
      aiModelId: "m1",
      categoryTagId: "tag-1",
      card: { topic: "T", markdownContent: "C" },
      questions: {
        freeResponseQuestions: [],
        fillTheBlankQuestions: [],
        multipleChoiceQuestions: [],
      },
    };

    it("generates questions then saves", async () => {
      const aiResponse = {
        freeResponseQuestions: [
          { markdownQuestion: "Q?", markdownAnswer: "A" },
        ],
        fillTheBlankQuestions: [],
        multipleChoiceQuestions: [],
      };
      mockFetchStructuredAIByModelId.mockResolvedValue(aiResponse);
      mockCardRepo.create.mockResolvedValue(undefined);
      mockQuestionRepo.createFreeResponseQuestions.mockResolvedValue(undefined);
      mockQuestionRepo.createFillTheBlankQuestions.mockResolvedValue(undefined);
      mockQuestionRepo.createMultipleChoiceQuestions.mockResolvedValue(undefined);

      const cardId = await service.generateQuestionsAndSave(saveRequest, [
        "freeResponse",
      ]);

      expect(typeof cardId).toBe("string");
      expect(mockCardRepo.create).toHaveBeenCalled();
      expect(
        mockQuestionRepo.createFreeResponseQuestions,
      ).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ MarkdownQuestion: "Q?" }),
        ]),
      );
    });
  });
});
