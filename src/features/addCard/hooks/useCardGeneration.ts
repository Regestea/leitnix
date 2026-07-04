import { useState } from "react";
import { fetchStructuredAIByModelId } from "../../../services/aiModelClient";
import {
  CARD_GENERATION_SYSTEM_PROMPT,
  QUESTION_GENERATION_SYSTEM_PROMPT,
  cardNotesResponseSchema,
  questionsResponseSchema,
  NONE_PROMPT_VALUE,
} from "../types";
import type {
  CardNotesResponse,
  QuestionsResponse,
  GeneratedCardData,
} from "../types";
import { CardRepository } from "../repository/CardRepository";
import { NoteRepository } from "../repository/NoteRepository";
import { QuestionRepository } from "../repository/QuestionRepository";
import { CustomPromptRepository } from "../../customPrompt/repository/CustomPromptRepository";

export function useCardGeneration() {
  const [generatedCard, setGeneratedCard] = useState<GeneratedCardData | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardRepo = new CardRepository();
  const noteRepo = new NoteRepository();
  const questionRepo = new QuestionRepository();
  const customPromptRepo = new CustomPromptRepository();

  const generateCard = async (
    aiModelId: string,
    topicText: string,
    customPromptId: string
  ): Promise<GeneratedCardData | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      let systemPrompt = CARD_GENERATION_SYSTEM_PROMPT;

      if (customPromptId && customPromptId !== NONE_PROMPT_VALUE) {
        const customPrompt = await customPromptRepo.getById(customPromptId);
        if (customPrompt?.Prompt) {
          systemPrompt = customPrompt.Prompt;
        }
      }

      const prompt = topicText;

      const response = await fetchStructuredAIByModelId<CardNotesResponse>({
        modelId: aiModelId,
        schema: cardNotesResponseSchema,
        prompt,
        systemPrompt,
      });

      const data: GeneratedCardData = {
        topicMarkdown: response.topicMarkdown,
        notes: response.notes.map((n) => n.markdownContent),
      };

      setGeneratedCard(data);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate card";
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQuestions = async (
    aiModelId: string,
    card: GeneratedCardData
  ): Promise<QuestionsResponse | null> => {
    setIsGeneratingQuestions(true);
    setError(null);

    try {
      const notesText = card.notes
        .map((note, i) => `Note ${i + 1}:\n${note}`)
        .join("\n\n");

      const prompt = `Topic:\n${card.topicMarkdown}\n\nNotes:\n${notesText}`;

      const response = await fetchStructuredAIByModelId<QuestionsResponse>({
        modelId: aiModelId,
        schema: questionsResponseSchema,
        prompt,
        systemPrompt: QUESTION_GENERATION_SYSTEM_PROMPT,
      });

      return response;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to generate questions";
      setError(message);
      return null;
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const saveCard = async (
    card: GeneratedCardData,
    questions: QuestionsResponse,
    _aiModelId: string,
    categoryTagId: string
  ): Promise<string | null> => {
    try {
      const firstBoxId = await cardRepo.getFirstBoxId();
      if (!firstBoxId) {
        setError("No box found. Please set up boxes first.");
        return null;
      }

      const cardId = crypto.randomUUID();
      const now = Date.now();

      await cardRepo.create({
        Id: cardId,
        BoxId: firstBoxId,
        CategoryTagId: categoryTagId,
        MarkdownTopic: card.topicMarkdown,
        LastReviewUnixTime: now,
        NextReviewUnixTime: now,
        StartedLearningUnixTime: now,
      });

      const notes = card.notes.map((markdownContent) => ({
        Id: crypto.randomUUID(),
        CardId: cardId,
        MarkdownContent: markdownContent,
      }));
      await noteRepo.createMany(notes);

      const freeResponseQuestions = questions.freeResponseQuestions.map((q) => ({
        Id: crypto.randomUUID(),
        CardId: cardId,
        MarkdownQuestion: q.markdownQuestion,
        MarkdownAnswer: q.markdownAnswer,
      }));
      await questionRepo.createFreeResponseQuestions(freeResponseQuestions);

      const fillTheBlankQuestions = questions.fillTheBlankQuestions.map((q) => ({
        Id: crypto.randomUUID(),
        CardId: cardId,
        MarkdownQuestion: q.markdownQuestion,
        MarkdownAnswer: q.markdownAnswer,
      }));
      await questionRepo.createFillTheBlankQuestions(fillTheBlankQuestions);

      const multipleChoiceQuestions =
        questions.multipleChoiceQuestions.map((q) => ({
          Id: crypto.randomUUID(),
          CardId: cardId,
          MarkdownQuestion: q.markdownQuestion,
          MarkdownOptionA: q.markdownOptionA,
          MarkdownOptionB: q.markdownOptionB,
          MarkdownOptionC: q.markdownOptionC,
          MarkdownOptionD: q.markdownOptionD,
          CorrectOption: q.correctOption,
        }));
      await questionRepo.createMultipleChoiceQuestions(multipleChoiceQuestions);

      return cardId;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save card";
      setError(message);
      return null;
    }
  };

  const clearGenerated = () => {
    setGeneratedCard(null);
    setError(null);
  };

  return {
    generatedCard,
    setGeneratedCard,
    isGenerating,
    isGeneratingQuestions,
    error,
    generateCard,
    generateQuestions,
    saveCard,
    clearGenerated,
  };
}
