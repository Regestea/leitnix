import { describe, it, expect, beforeEach, vi } from "vitest";
import type { MockDb } from "../dbTestHelper";
import { createInMemoryDb } from "../dbTestHelper";

const mockGetDb = vi.fn<() => Promise<MockDb>>();

vi.mock("../../src/db/connection", () => ({
  getDb: () => mockGetDb(),
}));

import { CategoryTagRepository } from "../../src/repositories/CategoryTagRepository";

describe("CategoryTagRepository", () => {
  let db: MockDb;

  beforeEach(() => {
    db = createInMemoryDb();
    mockGetDb.mockResolvedValue(db);
  });

  it("getAll returns empty array when no tags exist", async () => {
    const repo = new CategoryTagRepository();
    const result = await repo.getAll();
    expect(result).toEqual([]);
  });

  it("create and getAll work correctly", async () => {
    const repo = new CategoryTagRepository();
    await repo.create({ Id: "tag-1", Name: "Math" });
    await repo.create({ Id: "tag-2", Name: "Science" });

    const result = await repo.getAll();
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.Name)).toEqual(expect.arrayContaining(["Math", "Science"]));
  });

  it("update modifies a tag name", async () => {
    const repo = new CategoryTagRepository();
    await repo.create({ Id: "tag-1", Name: "Old Name" });

    await repo.update({ Id: "tag-1", Name: "New Name" });

    const result = await repo.getAll();
    expect(result[0].Name).toBe("New Name");
  });

  it("delete removes a tag", async () => {
    const repo = new CategoryTagRepository();
    await repo.create({ Id: "tag-1", Name: "Math" });

    await repo.delete("tag-1");
    const result = await repo.getAll();
    expect(result).toEqual([]);
  });

  it("getReviewTags returns only tags with cards due for review", async () => {
    const repo = new CategoryTagRepository();
    await repo.create({ Id: "tag-due", Name: "Due Tag" });
    await repo.create({ Id: "tag-not-due", Name: "Not Due Tag" });

    await db.run(
      `INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId)
       VALUES (?, ?, ?, ?, ?);`,
      ["box-1", "box1", 60, null, null],
    );

    const now = Math.floor(Date.now() / 1000);
    await db.run(
      `INSERT INTO Cards (Id, BoxId, CategoryTagId, MarkdownTopic, MarkdownContent, NextReviewUnixTime)
       VALUES (?, ?, ?, ?, ?, ?);`,
      ["card-1", "box-1", "tag-due", "Topic", "Content", now - 10],
    );

    await db.run(
      `INSERT INTO Cards (Id, BoxId, CategoryTagId, MarkdownTopic, MarkdownContent, NextReviewUnixTime)
       VALUES (?, ?, ?, ?, ?, ?);`,
      ["card-2", "box-1", "tag-not-due", "Topic 2", "Content 2", now + 99999],
    );

    const result = await repo.getReviewTags();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("tag-due");
  });
});
