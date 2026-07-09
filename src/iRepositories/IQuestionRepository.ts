export interface IQuestionRepository {
  createFreeResponseQuestions(
    questions: { Id: string; CardId: string; MarkdownQuestion: string; MarkdownAnswer: string }[]
  ): Promise<void>;
  createFillTheBlankQuestions(
    questions: { Id: string; CardId: string; MarkdownQuestion: string; MarkdownAnswer: string }[]
  ): Promise<void>;
  createMultipleChoiceQuestions(
    questions: {
      Id: string; CardId: string; MarkdownQuestion: string;
      MarkdownOptionA: string; MarkdownOptionB: string;
      MarkdownOptionC: string; MarkdownOptionD: string;
      CorrectOption: string;
    }[]
  ): Promise<void>;
}
