import { getDb } from "../../../db/connection";
import type {
  FreeResponseQuestion,
  FillTheBlankQuestion,
  MultipleChoiceQuestion,
} from "../../../shared/types/entities";

export class QuestionRepository {
  async createFreeResponseQuestions(
    questions: FreeResponseQuestion[]
  ): Promise<void> {
    const db = await getDb();
    for (const q of questions) {
      await db.run(
        `INSERT INTO FreeResponseQuestions (Id, CardId, MarkdownQuestion, MarkdownAnswer)
         VALUES (?, ?, ?, ?);`,
        [q.Id, q.CardId, q.MarkdownQuestion, q.MarkdownAnswer]
      );
    }
  }

  async createFillTheBlankQuestions(
    questions: FillTheBlankQuestion[]
  ): Promise<void> {
    const db = await getDb();
    for (const q of questions) {
      await db.run(
        `INSERT INTO FillTheBlankQuestions (Id, CardId, MarkdownQuestion, MarkdownAnswer)
         VALUES (?, ?, ?, ?);`,
        [q.Id, q.CardId, q.MarkdownQuestion, q.MarkdownAnswer]
      );
    }
  }

  async createMultipleChoiceQuestions(
    questions: MultipleChoiceQuestion[]
  ): Promise<void> {
    const db = await getDb();
    for (const q of questions) {
      await db.run(
        `INSERT INTO MultipleChoiceQuestions (Id, CardId, MarkdownQuestion, MarkdownOptionA, MarkdownOptionB, MarkdownOptionC, MarkdownOptionD, CorrectOption)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          q.Id,
          q.CardId,
          q.MarkdownQuestion,
          q.MarkdownOptionA,
          q.MarkdownOptionB,
          q.MarkdownOptionC,
          q.MarkdownOptionD,
          q.CorrectOption,
        ]
      );
    }
  }
}
