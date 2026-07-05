import { z } from "zod";
import { NONE_PROMPT_VALUE } from "../../statics/prompts";

// ─── Wizard Steps ───────────────────────────────────────────────────
// Const object drives which step tab is rendered.

export const AddCardWizardStep = {
  Generate: 1,
  Review: 2,
  Complete: 3,
} as const;

export type AddCardWizardStep = (typeof AddCardWizardStep)[keyof typeof AddCardWizardStep];

// ─── AI Response Models ─────────────────────────────────────────────

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

// ─── Request Models passed to CardService ──────────────────────────

export interface GenerateCardRequest {
  aiModelId: string;
  customPromptId: string;
  topicText: string;
}

export interface SaveCardRequest {
  aiModelId: string;
  categoryTagId: string;
  card: GeneratedCardData;
  questions: QuestionsResponse;
}

// ─── Domain Models ──────────────────────────────────────────────────

export interface GeneratedCardData {
  topicMarkdown: string;
  notes: string[];
}

// ─── Form State & Validation ────────────────────────────────────────

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
  topicText: z.string().trim().min(1, "Please enter a topic to generate a card."),
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
    errors[field] ??= issue.message;
  }
  return { success: false, errors };
}

export const EMPTY_FORM_STATE: AddCardFormState = {
  categoryTagId: "",
  aiModelId: "",
  customPromptId: NONE_PROMPT_VALUE,
  topicText: "",
};

// ─── Select Option Helper ───────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}
