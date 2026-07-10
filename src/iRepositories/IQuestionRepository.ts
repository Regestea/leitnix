import type {
  FillTheBlankQuestion,
  FreeResponseQuestion,
  MultipleChoiceQuestion,
} from "../db/entities.ts";

export interface IQuestionRepository {
  createFreeResponseQuestions(questions: FreeResponseQuestion[]): Promise<void>;
  createFillTheBlankQuestions(questions: FillTheBlankQuestion[]): Promise<void>;
  createMultipleChoiceQuestions(questions: MultipleChoiceQuestion[]): Promise<void>;
}
