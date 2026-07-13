import { describe, it, expect, beforeEach, vi } from "vitest";
import type { MockDb } from "../dbTestHelper";
import { createInMemoryDb } from "../dbTestHelper";

const mockGetDb = vi.fn<() => Promise<MockDb>>();

vi.mock("../../src/db/connection", () => ({
  getDb: () => mockGetDb(),
}));

import { CardRepository } from "../../src/repositories/CardRepository";

describe("CardRepository", () => {
  let db: MockDb;

  beforeEach(() => {
    db = createInMemoryDb();
    mockGetDb.mockResolvedValue(db);
  });

  it("create and getById work correctly", async () => {
    const repo = new CardRepository();
    const card = {
      Id: "card-1",
      BoxId: null,
      CategoryTagId: null,
      MarkdownTopic: "Test Topic",
      MarkdownContent: "Test Content",
      LastReviewUnixTime: null,
      NextReviewUnixTime: null,
      StartedLearningUnixTime: null,
    };

    await repo.create(card);
    const result = await repo.getById("card-1");

    expect(result).not.toBeNull();
    expect(result!.MarkdownTopic).toBe("Test Topic");
    expect(result!.MarkdownContent).toBe("Test Content");
  });

  it("getById returns null for non-existent card", async () => {
    const repo = new CardRepository();
    const result = await repo.getById("non-existent");
    expect(result).toBeNull();
  });

  it("getByCategoryTagId returns cards for a given tag", async () => {
    const repo = new CardRepository();
    await db.run("INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);", ["tag-1", "Tag 1"]);
    await db.run("INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);", ["tag-2", "Tag 2"]);

    await repo.create({ Id: "c1", BoxId: null, CategoryTagId: "tag-1", MarkdownTopic: "T1", MarkdownContent: "C1", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: null });
    await repo.create({ Id: "c2", BoxId: null, CategoryTagId: "tag-1", MarkdownTopic: "T2", MarkdownContent: "C2", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: null });
    await repo.create({ Id: "c3", BoxId: null, CategoryTagId: "tag-2", MarkdownTopic: "T3", MarkdownContent: "C3", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: null });

    const result = await repo.getByCategoryTagId("tag-1");
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.Id)).toEqual(["c1", "c2"]);
  });

  it("getPendingByTag returns cards with no box assigned", async () => {
    const repo = new CardRepository();
    await db.run("INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);", ["tag-1", "Tag 1"]);
    await db.run(
      "INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId) VALUES (?, ?, ?, ?, ?);",
      ["box-1", "box1", 60, null, null],
    );

    await repo.create({ Id: "c1", BoxId: null, CategoryTagId: "tag-1", MarkdownTopic: "T1", MarkdownContent: "C1", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: null });
    await repo.create({ Id: "c2", BoxId: "box-1", CategoryTagId: "tag-1", MarkdownTopic: "T2", MarkdownContent: "C2", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: null });

    const result = await repo.getPendingByTag("tag-1");
    expect(result).toHaveLength(1);
    expect(result[0].Id).toBe("c1");
  });

  it("getTagPendingCounts returns counts per tag", async () => {
    const repo = new CardRepository();
    await db.run("INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);", ["tag-1", "Tag 1"]);
    await db.run("INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);", ["tag-2", "Tag 2"]);

    await repo.create({ Id: "c1", BoxId: null, CategoryTagId: "tag-1", MarkdownTopic: "T1", MarkdownContent: "C1", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: null });
    await repo.create({ Id: "c2", BoxId: null, CategoryTagId: "tag-1", MarkdownTopic: "T2", MarkdownContent: "C2", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: null });
    await repo.create({ Id: "c3", BoxId: null, CategoryTagId: "tag-2", MarkdownTopic: "T3", MarkdownContent: "C3", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: null });

    const counts = await repo.getTagPendingCounts();
    expect(counts.get("tag-1")).toBe(2);
    expect(counts.get("tag-2")).toBe(1);
  });

  it("updateCategoryTagId updates tags for given cards", async () => {
    const repo = new CardRepository();
    await db.run("INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);", ["tag-1", "Tag 1"]);
    await db.run("INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);", ["new-tag", "New Tag"]);

    await repo.create({ Id: "c1", BoxId: null, CategoryTagId: "tag-1", MarkdownTopic: "T1", MarkdownContent: "C1", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: null });
    await repo.create({ Id: "c2", BoxId: null, CategoryTagId: "tag-1", MarkdownTopic: "T2", MarkdownContent: "C2", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: null });

    await repo.updateCategoryTagId(["c1", "c2"], "new-tag");

    const cards = await repo.getByCategoryTagId("new-tag");
    expect(cards).toHaveLength(2);
    expect(await repo.getByCategoryTagId("tag-1")).toHaveLength(0);
  });

  it("startLearning assigns card to the first box", async () => {
    const repo = new CardRepository();

    const boxId = crypto.randomUUID();
    await db.run(
      `INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId)
       VALUES (?, ?, ?, ?, ?);`,
      [boxId, "box1", 60, null, null],
    );

    await repo.create({ Id: "card-1", BoxId: null, CategoryTagId: null, MarkdownTopic: "T", MarkdownContent: "C", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: null });

    await repo.startLearning("card-1");

    const result = await repo.getById("card-1");
    expect(result!.BoxId).toBe(boxId);
    expect(result!.StartedLearningUnixTime).not.toBeNull();
    expect(result!.LastReviewUnixTime).not.toBeNull();
    expect(result!.NextReviewUnixTime).not.toBeNull();
  });

  it("markAsKnown moves card to finish box", async () => {
    const repo = new CardRepository();

    const finishId = crypto.randomUUID();
    const boxId = crypto.randomUUID();
    await db.run(
      `INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId)
       VALUES (?, ?, ?, ?, ?);`,
      [finishId, "finish", 0, null, null],
    );
    await db.run(
      `INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId)
       VALUES (?, ?, ?, ?, ?);`,
      [boxId, "box1", 60, finishId, null],
    );
    await db.run("UPDATE Boxes SET PreviousBoxId = ? WHERE Id = ?;", [boxId, finishId]);

    await repo.create({ Id: "card-1", BoxId: boxId, CategoryTagId: null, MarkdownTopic: "T", MarkdownContent: "C", LastReviewUnixTime: 1000, NextReviewUnixTime: 2000, StartedLearningUnixTime: null });

    await repo.markAsKnown("card-1");

    const result = await repo.getById("card-1");
    expect(result!.BoxId).toBe(finishId);
    expect(result!.NextReviewUnixTime).toBeNull();
    expect(result!.StartedLearningUnixTime).not.toBeNull();
  });

  it("countCardsNeedToReview returns count of due cards", async () => {
    const repo = new CardRepository();

    const boxId = crypto.randomUUID();
    await db.run(
      `INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId)
       VALUES (?, ?, ?, ?, ?);`,
      [boxId, "box1", 60, null, null],
    );
    await db.run("INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);", ["tag-1", "Tag 1"]);

    const now = Math.floor(Date.now() / 1000);
    await repo.create({ Id: "c1", BoxId: boxId, CategoryTagId: "tag-1", MarkdownTopic: "T1", MarkdownContent: "C1", LastReviewUnixTime: now - 100, NextReviewUnixTime: now - 10, StartedLearningUnixTime: null });
    await repo.create({ Id: "c2", BoxId: boxId, CategoryTagId: "tag-1", MarkdownTopic: "T2", MarkdownContent: "C2", LastReviewUnixTime: now - 100, NextReviewUnixTime: now + 99999, StartedLearningUnixTime: null });

    const count = await repo.countCardsNeedToReview("tag-1");
    expect(count).toBe(1);
  });

  it("getCardNeedToReview returns the next due card", async () => {
    const repo = new CardRepository();

    const boxId = crypto.randomUUID();
    await db.run(
      `INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId)
       VALUES (?, ?, ?, ?, ?);`,
      [boxId, "box1", 60, null, null],
    );
    await db.run("INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);", ["tag-1", "Tag 1"]);

    const now = Math.floor(Date.now() / 1000);
    await repo.create({ Id: "c1", BoxId: boxId, CategoryTagId: "tag-1", MarkdownTopic: "T1", MarkdownContent: "C1", LastReviewUnixTime: now - 200, NextReviewUnixTime: now - 100, StartedLearningUnixTime: null });
    await repo.create({ Id: "c2", BoxId: boxId, CategoryTagId: "tag-1", MarkdownTopic: "T2", MarkdownContent: "C2", LastReviewUnixTime: now - 200, NextReviewUnixTime: now + 99999, StartedLearningUnixTime: null });

    const card = await repo.getCardNeedToReview("tag-1");
    expect(card).not.toBeNull();
    expect(card!.Id).toBe("c1");
  });

  it("countStartedLearningLast24h returns count of recently started cards", async () => {
    const repo = new CardRepository();

    const now = Math.floor(Date.now() / 1000);
    await repo.create({ Id: "c1", BoxId: null, CategoryTagId: null, MarkdownTopic: "T1", MarkdownContent: "C1", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: now - 100 });
    await repo.create({ Id: "c2", BoxId: null, CategoryTagId: null, MarkdownTopic: "T2", MarkdownContent: "C2", LastReviewUnixTime: null, NextReviewUnixTime: null, StartedLearningUnixTime: now - 100000 });

    const count = await repo.countStartedLearningLast24h();
    expect(count).toBe(1);
  });
});
