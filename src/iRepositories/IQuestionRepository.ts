import type {
  FillTheBlankQuestion,
  FreeResponseQuestion,
  MultipleChoiceQuestion,
} from "../db/entities.ts";

type Question =
  | FreeResponseQuestion
  | FillTheBlankQuestion
  | MultipleChoiceQuestion;

export interface IQuestionRepository {
  createFreeResponseQuestions(questions: FreeResponseQuestion[]): Promise<void>;
  createFillTheBlankQuestions(questions: FillTheBlankQuestion[]): Promise<void>;
  createMultipleChoiceQuestions(
    questions: MultipleChoiceQuestion[],
  ): Promise<void>;
  getRandomQuestion(cardId: string): Promise<Question>;
}
