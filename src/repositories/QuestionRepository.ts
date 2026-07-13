import { getDb } from "../db/connection";
import type { IQuestionRepository, Question, QuestionType } from "../iRepositories/IQuestionRepository.ts";
import type {
  FillTheBlankQuestion,
  FreeResponseQuestion,
  MultipleChoiceQuestion,
} from "../db/entities.ts";

export class QuestionRepository implements IQuestionRepository {
 async markQuestionAsReviewed(
  question: QuestionType,
  questionId: string,
): Promise<void> {
  const db = await getDb();

  const table = `${question}`;

  await db.run(
    `
    UPDATE ${table}
    SET AskedTimes = AskedTimes + 1
    WHERE Id = ?;
    `,
    [questionId],
  );
}

  async getRandomQuestion(cardId: string): Promise<Question> {
    const db = await getDb();

    const result = await db.query(
      `
    SELECT *
    FROM (
      SELECT 
        Id,
        CardId,
        'FreeResponse' AS Type,
        MarkdownQuestion,
        MarkdownAnswer,
        NULL AS MarkdownOptionA,
        NULL AS MarkdownOptionB,
        NULL AS MarkdownOptionC,
        NULL AS MarkdownOptionD,
        NULL AS CorrectOption,
        AskedTimes
      FROM FreeResponseQuestions
      WHERE CardId = ?

      UNION ALL

      SELECT
        Id,
        CardId,
        'FillTheBlank' AS Type,
        MarkdownQuestion,
        MarkdownAnswer,
        NULL AS MarkdownOptionA,
        NULL AS MarkdownOptionB,
        NULL AS MarkdownOptionC,
        NULL AS MarkdownOptionD,
        NULL AS CorrectOption,
        AskedTimes
      FROM FillTheBlankQuestions
      WHERE CardId = ?

      UNION ALL

      SELECT
        Id,
        CardId,
        'MultipleChoice' AS Type,
        MarkdownQuestion,
        NULL AS MarkdownAnswer,
        MarkdownOptionA,
        MarkdownOptionB,
        MarkdownOptionC,
        MarkdownOptionD,
        CorrectOption,
        AskedTimes
      FROM MultipleChoiceQuestions
      WHERE CardId = ?
    )
    ORDER BY AskedTimes ASC
    LIMIT 1;
    `,
      [cardId, cardId, cardId],
    );

    return result.values![0] as Question;
  }

  private async createMany(
    table: string,
    columns: string,
    rows: { Id: string; CardId: string }[],
  ): Promise<void> {
    const db = await getDb();
    const placeholders = columns
      .split(", ")
      .map(() => "?")
      .join(", ");
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders});`;

    for (const row of rows) {
      const values = columns
        .split(", ")
        .map((col) => (row as Record<string, unknown>)[col]);
      await db.run(sql, values);
    }
  }

  async createFreeResponseQuestions(
    questions: FreeResponseQuestion[],
  ): Promise<void> {
    await this.createMany(
      "FreeResponseQuestions",
      "Id, CardId, MarkdownQuestion, MarkdownAnswer, AskedTimes",
      questions,
    );
  }

  async createFillTheBlankQuestions(
    questions: FillTheBlankQuestion[],
  ): Promise<void> {
    await this.createMany(
      "FillTheBlankQuestions",
      "Id, CardId, MarkdownQuestion, MarkdownAnswer, AskedTimes",
      questions,
    );
  }

  async createMultipleChoiceQuestions(
    questions: MultipleChoiceQuestion[],
  ): Promise<void> {
    await this.createMany(
      "MultipleChoiceQuestions",
      "Id, CardId, MarkdownQuestion, MarkdownOptionA, MarkdownOptionB, MarkdownOptionC, MarkdownOptionD, CorrectOption, AskedTimes",
      questions,
    );
  }
}

export const questionRepository: IQuestionRepository = new QuestionRepository();
