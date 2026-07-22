export type WrongAnswerPunishment =
  | "None"
  | "JumpOneBoxBack"
  | "JumpToFirstBox";

export interface Setting {
  WrongAnswerPunishment: WrongAnswerPunishment;
  ReadAloudBadge: boolean;
  Notification: boolean;
  NotificationHour: number | null;
  NotificationMinute: number | null;
  IsShowTranslationControl: boolean;
  DefaultTranslationTarget: string;
}

export interface Theme {
  Id: string; 
  FontFamily: string | null;
  FontSize: string | null;
  FontWeight: string | null;
  Theme: string | null;
  AndroidNavigation: boolean | null;
}

export type AiProvider =
  | "GoogleGemini"
  | "OpenRouter"
  | "AvalAi"
  | "OpenAi"
  | "OpenAiCompatible";

export type AiModel = {
  Id: string;
  DisplayName: string | null;
  URL: string | null;
  ModelName: string | null;
  APIKey: string | null;
  Provider: AiProvider;
};

export interface CustomPrompt {
  Id: string;
  Name: string;
  Prompt: string;
}

export interface CategoryTag {
  Id: string;
  Name: string;
}

export interface Box {
  Id: string;
  Name: string;
  RepeatIntervalSeconds: number;
  NextBoxId: string | null;
  PreviousBoxId: string | null;
}

export interface Card {
  Id: string;
  BoxId: string | null;
  CategoryTagId: string | null;
  Topic: string;
  MarkdownContent: string;
  LastReviewUnixTime: number | null;
  NextReviewUnixTime: number | null;
  StartedLearningUnixTime: number | null;
}

export interface FreeResponseQuestion {
  Id: string;
  CardId: string;
  MarkdownQuestion: string | null;
  MarkdownAnswer: string | null;
  AskedTimes: number;
}

export interface FillTheBlankQuestion {
  Id: string;
  CardId: string;
  MarkdownQuestion: string | null;
  MarkdownAnswer: string | null;
  AskedTimes: number;
}

export type MultipleChoiceOption = "A" | "B" | "C" | "D";

export const MULTIPLE_CHOICE_OPTIONS: readonly MultipleChoiceOption[] = ["A", "B", "C", "D"];

export function isValidMultipleChoiceOption(value: string): value is MultipleChoiceOption {
  return (MULTIPLE_CHOICE_OPTIONS as readonly string[]).includes(value);
}

export interface MultipleChoiceQuestion {
  Id: string;
  CardId: string;
  MarkdownQuestion: string | null;
  MarkdownOptionA: string | null;
  MarkdownOptionB: string | null;
  MarkdownOptionC: string | null;
  MarkdownOptionD: string | null;
  CorrectOption: MultipleChoiceOption | null;
  AskedTimes: number;
}
