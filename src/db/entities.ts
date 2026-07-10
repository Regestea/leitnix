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
  MarkdownTopic: string;
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
