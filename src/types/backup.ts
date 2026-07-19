export type BackupTable =
  | "AiModels"
  | "CustomPrompts"
  | "CategoryTags"
  | "Boxes"
  | "Cards"
  | "FreeResponseQuestions"
  | "FillTheBlankQuestions"
  | "MultipleChoiceQuestions";

export interface BackupOptions {
  tables: BackupTable[];
  categoryTagFilter?: "all" | string[];
}

export type BackupDataPerTable = Partial<{
  AiModels: Record<string, unknown>[];
  CustomPrompts: Record<string, unknown>[];
  CategoryTags: Record<string, unknown>[];
  Boxes: Record<string, unknown>[];
  Cards: Record<string, unknown>[];
  FreeResponseQuestions: Record<string, unknown>[];
  FillTheBlankQuestions: Record<string, unknown>[];
  MultipleChoiceQuestions: Record<string, unknown>[];
}>;
