import type {
  FillTheBlankQuestion,
  FreeResponseQuestion,
  MultipleChoiceQuestion,
} from "../db/entities.ts";

export type Question =
  | FreeResponseQuestion
  | FillTheBlankQuestion
  | MultipleChoiceQuestion;

export type QuestionType =
  | "FreeResponseQuestions"
  | "FillTheBlankQuestions"
  | "MultipleChoiceQuestions";


export interface IQuestionRepository {
  createFreeResponseQuestions(questions: FreeResponseQuestion[]): Promise<void>;
  createFillTheBlankQuestions(questions: FillTheBlankQuestion[]): Promise<void>;
  createMultipleChoiceQuestions(
    questions: MultipleChoiceQuestion[],
  ): Promise<void>;
  getRandomQuestion(cardId: string): Promise<Question>;
  markQuestionAsReviewed(questionType:QuestionType,questionId: string): Promise<void>;
}
