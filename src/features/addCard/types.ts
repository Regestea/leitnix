import { z } from "zod";

// ─── AI Response Schemas ────────────────────────────────────────────

export const cardNotesResponseSchema = z.object({
  topicMarkdown: z.string(),
  notes: z.array(
    z.object({
      markdownContent: z.string(),
    })
  ),
});

export type CardNotesResponse = z.infer<typeof cardNotesResponseSchema>;

export const questionsResponseSchema = z.object({
  freeResponseQuestions: z.array(
    z.object({
      markdownQuestion: z.string(),
      markdownAnswer: z.string(),
    })
  ),
  fillTheBlankQuestions: z.array(
    z.object({
      markdownQuestion: z.string(),
      markdownAnswer: z.string(),
    })
  ),
  multipleChoiceQuestions: z.array(
    z.object({
      markdownQuestion: z.string(),
      markdownOptionA: z.string(),
      markdownOptionB: z.string(),
      markdownOptionC: z.string(),
      markdownOptionD: z.string(),
      correctOption: z.enum(["A", "B", "C", "D"]),
    })
  ),
});

export type QuestionsResponse = z.infer<typeof questionsResponseSchema>;

// ─── System Prompts ───────────────────────────────────────────────────

export const CARD_GENERATION_SYSTEM_PROMPT =
  "You are an expert educational content creator. Given a topic, generate a concise flashcard summary and multiple detailed study notes. Return the topic summary as markdown and a list of detailed notes as markdown content blocks.";

export const QUESTION_GENERATION_SYSTEM_PROMPT =
  "You are an expert question generator. Given a flashcard topic and its study notes, generate different types of assessment questions: free-response, fill-in-the-blank, and multiple-choice. All content in markdown.";

// ─── Wizard Types ────────────────────────────────────────────────────

export type WizardStep = 1 | 2 | 3;

export interface GeneratedCardData {
  topicMarkdown: string;
  notes: string[];
}

// ─── Form State & Validation ─────────────────────────────────────────

export interface AddCardFormState {
  categoryTagId: string;
  aiModelId: string;
  customPromptId: string;
  topicText: string;
}

export const addCardFormSchema = z.object({
  categoryTagId: z.string().min(1, "Please select a category tag."),
  aiModelId: z.string().min(1, "Please select an AI model."),
  customPromptId: z.string(),
  topicText: z
    .string()
    .trim()
    .min(1, "Please enter a topic to generate a card."),
});

export type AddCardFormErrors = Partial<
  Record<keyof z.infer<typeof addCardFormSchema>, string>
>;

export function validateAddCardForm(form: AddCardFormState): {
  success: boolean;
  errors: AddCardFormErrors;
} {
  const result = addCardFormSchema.safeParse(form);

  if (result.success) {
    return { success: true, errors: {} };
  }

  const errors: AddCardFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof AddCardFormErrors;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}

export const EMPTY_FORM_STATE: AddCardFormState = {
  categoryTagId: "",
  aiModelId: "",
  customPromptId: "",
  topicText: "",
};

// ─── Constants ───────────────────────────────────────────────────────

export const NONE_PROMPT_VALUE = "none";
