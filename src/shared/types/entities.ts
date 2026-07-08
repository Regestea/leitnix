export type WrongAnswerPunishment =
  | "None"
  | "JumpOneBoxBack"
  | "JumpToFirstBox";

export interface Setting {
  Id: string;
  WrongAnswerPunishment: WrongAnswerPunishment;
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
  Name: string | null;
  Prompt: string | null;
}

export interface CategoryTag {
  Id: string;
  Name: string | null;
}

export interface Box {
  Id: string;
  Name: string | null;
  RepeatIntervalSeconds: number | null;
  NextBoxId: string | null;
  PreviousBoxId: string | null;
}

export interface Card {
  Id: string;
  BoxId: string;
  CategoryTagId: string | null;
  MarkdownTopic: string | null;
  MarkdownContent: string | null;
  LastReviewUnixTime: number | null;
  NextReviewUnixTime: number | null;
  StartedLearningUnixTime: number | null;
}

export interface FreeResponseQuestion {
  Id: string;
  CardId: string;
  MarkdownQuestion: string | null;
  MarkdownAnswer: string | null;
}

export interface FillTheBlankQuestion {
  Id: string;
  CardId: string;
  MarkdownQuestion: string | null;
  MarkdownAnswer: string | null;
}

export type MultipleChoiceOption = "A" | "B" | "C" | "D";

export interface MultipleChoiceQuestion {
  Id: string;
  CardId: string;
  MarkdownQuestion: string | null;
  MarkdownOptionA: string | null;
  MarkdownOptionB: string | null;
  MarkdownOptionC: string | null;
  MarkdownOptionD: string | null;
  CorrectOption: MultipleChoiceOption | null;
}
