export interface Setting {
  Id: string;
  FontFamily: string | null;
  FontSize: string | null;
  FontWeight: string | null;
  Theme: string | null;
  AndroidNavigation: boolean | null;
}

export interface AiModel {
  Id: string;
  DisplayName: string | null;
  URL: string | null;
  ModelName: string | null;
  APIKey: string | null;
}

export interface CategoryTag {
  Id: string;
  Name: string | null;
}

export interface Box {
  Id: string;
  Name: string | null;
  RepeatPeriodUnixTime: number | null;
  NextBoxId: string | null;
  PreviousBoxId: string | null;
}

export interface Card {
  Id: string;
  BoxId: string;
  CategoryTagId: string | null;
  MarkdownTopic: string | null;
}

export interface Note {
  Id: string;
  CardId: string;
  NextReviewUnixTime: number | null;
}

export interface Content {
  Id: string;
  NoteId: string;
  MarkdownContent: string | null;
}

export interface FreeResponseQuestion {
  Id: string;
  NoteId: string;
  MarkdownQuestion: string | null;
  MarkdownAnswer: string | null;
}

export interface FillTheBlankQuestion {
  Id: string;
  NoteId: string;
  MarkdownQuestion: string | null;
  MarkdownAnswer: string | null;
}

export type MultipleChoiceOption = "A" | "B" | "C" | "D";

export interface MultipleChoiceQuestion {
  Id: string;
  NoteId: string;
  MarkdownQuestion: string | null;
  MarkdownOptionA: string | null;
  MarkdownOptionB: string | null;
  MarkdownOptionC: string | null;
  MarkdownOptionD: string | null;
  CorrectOption: MultipleChoiceOption | null;
}