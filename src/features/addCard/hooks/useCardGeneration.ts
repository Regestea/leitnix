import { useState, useCallback } from "react";
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

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function buildCardPrompt(card: GeneratedCardData): string {
  const notesText = card.notes
    .map((note, i) => `Note ${i + 1}:\n${note}`)
    .join("\n\n");
  return `Topic:\n${card.topicMarkdown}\n\nNotes:\n${notesText}`;
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

export function useCardGeneration() {
  const [generatedCard, setGeneratedCard] =
    useState<GeneratedCardData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCard = useCallback(
    async (
      aiModelId: string,
      topicText: string,
      customPromptId: string
    ): Promise<GeneratedCardData | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const systemPrompt = await resolveSystemPrompt(
          customPromptId,
          CARD_GENERATION_SYSTEM_PROMPT
        );

        const response = await fetchStructuredAIByModelId<CardNotesResponse>({
          modelId: aiModelId,
          schema: cardNotesResponseSchema,
          prompt: topicText,
          systemPrompt,
        });

        const data: GeneratedCardData = {
          topicMarkdown: response.topicMarkdown,
          notes: response.notes.map((n) => n.markdownContent),
        };

        setGeneratedCard(data);
        return data;
      } catch (err) {
        setError(getErrorMessage(err, "Failed to generate card"));
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const generateQuestions = useCallback(
    async (
      aiModelId: string,
      card: GeneratedCardData
    ): Promise<QuestionsResponse | null> => {
      setIsGeneratingQuestions(true);
      setError(null);

      try {
        const response = await fetchStructuredAIByModelId<QuestionsResponse>({
          modelId: aiModelId,
          schema: questionsResponseSchema,
          prompt: buildCardPrompt(card),
          systemPrompt: QUESTION_GENERATION_SYSTEM_PROMPT,
        });

        return response;
      } catch (err) {
        setError(getErrorMessage(err, "Failed to generate questions"));
        return null;
      } finally {
        setIsGeneratingQuestions(false);
      }
    },
    []
  );

  const saveCard = useCallback(
    async (
      card: GeneratedCardData,
      questions: QuestionsResponse,
      categoryTagId: string
    ): Promise<string | null> => {
      const cardRepo = new CardRepository();
      const noteRepo = new NoteRepository();
      const questionRepo = new QuestionRepository();

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

        await noteRepo.createMany(
          card.notes.map((markdownContent) => ({
            Id: crypto.randomUUID(),
            CardId: cardId,
            MarkdownContent: markdownContent,
          }))
        );

        await questionRepo.createFreeResponseQuestions(
          questions.freeResponseQuestions.map((q) => ({
            Id: crypto.randomUUID(),
            CardId: cardId,
            MarkdownQuestion: q.markdownQuestion,
            MarkdownAnswer: q.markdownAnswer,
          }))
        );

        await questionRepo.createFillTheBlankQuestions(
          questions.fillTheBlankQuestions.map((q) => ({
            Id: crypto.randomUUID(),
            CardId: cardId,
            MarkdownQuestion: q.markdownQuestion,
            MarkdownAnswer: q.markdownAnswer,
          }))
        );

        await questionRepo.createMultipleChoiceQuestions(
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
        setError(getErrorMessage(err, "Failed to save card"));
        return null;
      }
    },
    []
  );

  const clearGenerated = useCallback(() => {
    setGeneratedCard(null);
    setError(null);
  }, []);

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
