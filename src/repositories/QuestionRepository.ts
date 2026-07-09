import { getDb } from "../db/connection";
import type { IQuestionRepository } from "../iRepositories/IQuestionRepository.ts";

interface QuestionRow {
  Id: string;
  CardId: string;
  [column: string]: unknown;
}

export class QuestionRepository implements IQuestionRepository {
  private async createMany(table: string, columns: string, rows: QuestionRow[]): Promise<void> {
    const db = await getDb();
    const placeholders = columns.split(", ").map(() => "?").join(", ");
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders});`;

    for (const row of rows) {
      const values = columns.split(", ").map((col) => row[col]);
      await db.run(sql, values);
    }
  }

  async createFreeResponseQuestions(
    questions: { Id: string; CardId: string; MarkdownQuestion: string; MarkdownAnswer: string }[]
  ): Promise<void> {
    await this.createMany(
      "FreeResponseQuestions",
      "Id, CardId, MarkdownQuestion, MarkdownAnswer",
      questions,
    );
  }

  async createFillTheBlankQuestions(
    questions: { Id: string; CardId: string; MarkdownQuestion: string; MarkdownAnswer: string }[]
  ): Promise<void> {
    await this.createMany(
      "FillTheBlankQuestions",
      "Id, CardId, MarkdownQuestion, MarkdownAnswer",
      questions,
    );
  }

  async createMultipleChoiceQuestions(
    questions: {
      Id: string; CardId: string; MarkdownQuestion: string;
      MarkdownOptionA: string; MarkdownOptionB: string;
      MarkdownOptionC: string; MarkdownOptionD: string;
      CorrectOption: string;
    }[]
  ): Promise<void> {
    await this.createMany(
      "MultipleChoiceQuestions",
      "Id, CardId, MarkdownQuestion, MarkdownOptionA, MarkdownOptionB, MarkdownOptionC, MarkdownOptionD, CorrectOption",
      questions,
    );
  }
}

export const questionRepository: IQuestionRepository = new QuestionRepository();
