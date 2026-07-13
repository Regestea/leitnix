import { describe, it, expect, beforeEach, vi } from "vitest";
import type { MockDb } from "../dbTestHelper";
import { createInMemoryDb } from "../dbTestHelper";

const mockGetDb = vi.fn<() => Promise<MockDb>>();

vi.mock("../../src/db/connection", () => ({
  getDb: () => mockGetDb(),
}));

import { QuestionRepository } from "../../src/repositories/QuestionRepository";

describe("QuestionRepository", () => {
  let db: MockDb;

  beforeEach(() => {
    db = createInMemoryDb();
    mockGetDb.mockResolvedValue(db);
  });

  async function createCard(id: string = "card-1") {
    await db.run(
      `INSERT INTO Cards (Id, BoxId, CategoryTagId, MarkdownTopic, MarkdownContent)
       VALUES (?, ?, ?, ?, ?);`,
      [id, null, null, "Topic", "Content"],
    );
  }

  it("createFreeResponseQuestions inserts questions", async () => {
    const repo = new QuestionRepository();
    await createCard();

    await repo.createFreeResponseQuestions([
      { Id: "q1", CardId: "card-1", MarkdownQuestion: "What is 2+2?", MarkdownAnswer: "4", AskedTimes: 0 },
      { Id: "q2", CardId: "card-1", MarkdownQuestion: "What is 3+3?", MarkdownAnswer: "6", AskedTimes: 0 },
    ]);

    const result = await db.query("SELECT * FROM FreeResponseQuestions WHERE CardId = ?;", ["card-1"]);
    expect(result.values).toHaveLength(2);
  });

  it("createFillTheBlankQuestions inserts questions", async () => {
    const repo = new QuestionRepository();
    await createCard();

    await repo.createFillTheBlankQuestions([
      { Id: "q1", CardId: "card-1", MarkdownQuestion: "The capital of France is __.", MarkdownAnswer: "Paris", AskedTimes: 0 },
    ]);

    const result = await db.query("SELECT * FROM FillTheBlankQuestions WHERE CardId = ?;", ["card-1"]);
    expect(result.values).toHaveLength(1);
  });

  it("createMultipleChoiceQuestions inserts questions", async () => {
    const repo = new QuestionRepository();
    await createCard();

    await repo.createMultipleChoiceQuestions([
      {
        Id: "q1",
        CardId: "card-1",
        MarkdownQuestion: "What is 2+2?",
        MarkdownOptionA: "3",
        MarkdownOptionB: "4",
        MarkdownOptionC: "5",
        MarkdownOptionD: "6",
        CorrectOption: "B",
        AskedTimes: 0,
      },
    ]);

    const result = await db.query("SELECT * FROM MultipleChoiceQuestions WHERE CardId = ?;", ["card-1"]);
    expect(result.values).toHaveLength(1);
  });

  it("getRandomQuestion returns the least-asked question", async () => {
    const repo = new QuestionRepository();
    await createCard();

    await repo.createFreeResponseQuestions([
      { Id: "fr-1", CardId: "card-1", MarkdownQuestion: "Q1?", MarkdownAnswer: "A1", AskedTimes: 5 },
      { Id: "fr-2", CardId: "card-1", MarkdownQuestion: "Q2?", MarkdownAnswer: "A2", AskedTimes: 1 },
    ]);

    const question = await repo.getRandomQuestion("card-1") as unknown as { Id: string; Type: string };
    expect(question.Id).toBe("fr-2");
  });

  it("getRandomQuestion returns across all question types", async () => {
    const repo = new QuestionRepository();
    await createCard();

    await repo.createFreeResponseQuestions([
      { Id: "fr-1", CardId: "card-1", MarkdownQuestion: "Free response Q?", MarkdownAnswer: "Answer", AskedTimes: 0 },
    ]);
    await repo.createMultipleChoiceQuestions([
      {
        Id: "mc-1",
        CardId: "card-1",
        MarkdownQuestion: "MC Q?",
        MarkdownOptionA: "A",
        MarkdownOptionB: "B",
        MarkdownOptionC: "C",
        MarkdownOptionD: "D",
        CorrectOption: "A",
        AskedTimes: 3,
      },
    ]);

    const question = await repo.getRandomQuestion("card-1");
    expect((question as unknown as { Type: string }).Type).toBe("FreeResponse");
  });

  it("markQuestionAsReviewed increments AskedTimes", async () => {
    const repo = new QuestionRepository();
    await createCard();

    await repo.createFreeResponseQuestions([
      { Id: "fr-1", CardId: "card-1", MarkdownQuestion: "Q?", MarkdownAnswer: "A", AskedTimes: 0 },
    ]);

    await repo.markQuestionAsReviewed("FreeResponseQuestions", "fr-1");

    const result = await db.query("SELECT AskedTimes FROM FreeResponseQuestions WHERE Id = ?;", ["fr-1"]);
    const row = result.values[0] as { AskedTimes: number };
    expect(row.AskedTimes).toBe(1);
  });
});
