import { getDb } from "../db/connection";
import type { IQuestionRepository, Question, QuestionType } from "../iRepositories/IQuestionRepository.ts";
import { unixTimeNow } from "../extensions/timeExtension.ts";
import type {
  FillTheBlankQuestion,
  FreeResponseQuestion,
  MultipleChoiceQuestion,
} from "../db/entities.ts";

export class QuestionRepository implements IQuestionRepository {
  async markQuestionAsReviewed(
    questionType: QuestionType,
    questionId: string,
    isCorrect: boolean,
  ): Promise<void> {
    const db = await getDb();

    const questionResult = await db.query(
      `SELECT CardId FROM ${questionType} WHERE Id = ?;`,
      [questionId],
    );
    const cardId = (questionResult.values![0] as { CardId: string }).CardId;

    await db.run(
      `UPDATE ${questionType} SET AskedTimes = AskedTimes + 1 WHERE Id = ?;`,
      [questionId],
    );

    const cardResult = await db.query(
      "SELECT BoxId FROM Cards WHERE Id = ?;",
      [cardId],
    );
    const boxId = (cardResult.values![0] as { BoxId: string | null }).BoxId;

    if (!boxId) return;

    const boxResult = await db.query(
      "SELECT NextBoxId, RepeatIntervalSeconds FROM Boxes WHERE Id = ?;",
      [boxId],
    );
    const box = boxResult.values![0] as {
      NextBoxId: string | null;
      RepeatIntervalSeconds: number;
    };

    const newBoxId = isCorrect && box.NextBoxId ? box.NextBoxId : boxId;
    const now = unixTimeNow();

    const newBoxResult = await db.query(
      "SELECT RepeatIntervalSeconds FROM Boxes WHERE Id = ?;",
      [newBoxId],
    );
    const newBox = newBoxResult.values![0] as {
      RepeatIntervalSeconds: number;
    };

    await db.run(
      `UPDATE Cards
       SET BoxId = ?,
           LastReviewUnixTime = ?,
           NextReviewUnixTime = ?
       WHERE Id = ?;`,
      [newBoxId, now, now + newBox.RepeatIntervalSeconds, cardId],
    );
  }

  async getRandomQuestion(cardId: string): Promise<Question> {
    const db = await getDb();

    const result = await db.query(
      `    WITH all_questions AS (
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
    SELECT * FROM all_questions
    WHERE AskedTimes = (SELECT MIN(AskedTimes) FROM all_questions)
    ORDER BY RANDOM()
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
