import { z } from "zod";
import { TopicType } from "./topicPrompts";
import { TOPIC_OPTIONS } from "./topicPrompts";

export const NONE_PROMPT_VALUE = "none";

// ─── Topic Mode ─────────────────────────────────────────────────────

export const TOPIC_MODES = ["single", "multiple"] as const;
export type TopicMode = (typeof TOPIC_MODES)[number];

export const TOPIC_MODE_LABELS: Record<TopicMode, string> = {
  single: "Single Topic",
  multiple: "Multiple Topics",
};

/** Splits the textarea content into topics — one non-empty trimmed line per topic. */
export function parseTopics(topicText: string): string[] {
  return topicText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

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
  topic: z.string(),
  markdownContent: z.string(),
});

export type CardNotesResponse = z.infer<typeof cardNotesResponseSchema>;

export const freeResponseQuestionSchema = z.object({
  markdownQuestion: z.string(),
  markdownAnswer: z.string(),
});

export const fillTheBlankQuestionSchema = z.object({
  markdownQuestion: z.string(),
  markdownAnswer: z.string(),
});

export const multipleChoiceQuestionSchema = z.object({
  markdownQuestion: z.string(),
  markdownOptionA: z.string(),
  markdownOptionB: z.string(),
  markdownOptionC: z.string(),
  markdownOptionD: z.string(),
  correctOption: z.enum(["A", "B", "C", "D"]),
});

export const questionsResponseSchema = z.object({
  freeResponseQuestions: z.array(freeResponseQuestionSchema),
  fillTheBlankQuestions: z.array(fillTheBlankQuestionSchema),
  multipleChoiceQuestions: z.array(multipleChoiceQuestionSchema),
});

export type QuestionsResponse = z.infer<typeof questionsResponseSchema>;

// Dedicated schemas for generating one question type per AI call.
export const freeResponseQuestionsSchema = z.object({
  questions: z.array(freeResponseQuestionSchema),
});
export type FreeResponseQuestionsResponse = z.infer<typeof freeResponseQuestionsSchema>;

export const fillTheBlankQuestionsSchema = z.object({
  questions: z.array(fillTheBlankQuestionSchema),
});
export type FillTheBlankQuestionsResponse = z.infer<typeof fillTheBlankQuestionsSchema>;

export const multipleChoiceQuestionsSchema = z.object({
  questions: z.array(multipleChoiceQuestionSchema),
});
export type MultipleChoiceQuestionsResponse = z.infer<typeof multipleChoiceQuestionsSchema>;

// ─── Request Models passed to CardService ──────────────────────────

export interface GenerateCardRequest {
  topicType: TopicType;
  aiModelId: string;
  customPromptId: string;
  topicText: string;
  images?: string[];
}

export interface SaveCardRequest {
  aiModelId: string;
  categoryTagId: string;
  card: GeneratedCardData;
  questions: QuestionsResponse;
  topicType: TopicType;
}

// ─── Domain Models ──────────────────────────────────────────────────

export interface GeneratedCardData {
  topic: string;
  markdownContent: string;
}

// ─── Form State & Validation ────────────────────────────────────────

export interface AddCardFormState {
  topicMode: TopicMode;
  topicType: TopicType;
  categoryTagId: string;
  aiModelId: string;
  customPromptId: string;
  topicText: string;
}

export const addCardFormSchema = z.object({
  topicType: z.enum(TOPIC_OPTIONS.map((o) => o.value) as [string, ...string[]], { message: "Please select a topic." }),
  categoryTagId: z.string().min(1, "Please select a category tag."),
  aiModelId: z.string().min(1, "Please select an AI model."),
  customPromptId: z.string(),
  topicText: z.string().trim().min(1, "Please enter a topic to generate a card."),
});

export type AddCardFormErrors = Partial<
  Record<keyof AddCardFormState, string>
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
  topicMode: "single",
  topicType: TopicType.Science,
  categoryTagId: "",
  aiModelId: "",
  customPromptId: NONE_PROMPT_VALUE,
  topicText: "",
};

// ─── Question Type Selection ───────────────────────────────────────

export const QUESTION_TYPES = [
  "freeResponse",
  "fillTheBlank",
  "multipleChoice",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  freeResponse: "Free Response",
  fillTheBlank: "Fill in the Blank",
  multipleChoice: "Multiple Choice",
};

// ─── Select Option Helper ───────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}
