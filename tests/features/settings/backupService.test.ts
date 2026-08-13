import { describe, it, expect, beforeEach, vi } from "vitest";
import type { MockDb } from "../../dbTestHelper";
import { createInMemoryDb } from "../../dbTestHelper";

const mockGetDb = vi.fn<() => Promise<MockDb>>();

vi.mock("../../../src/db/connection", () => ({
  getDb: () => mockGetDb(),
}));

import {
  exportTables,
  createBackupZip,
  parseBackupZip,
  importBackupZip,
  resolveDependencies,
} from "../../../src/features/settings/backupService";


describe("resolveDependencies", () => {
  it("returns empty for no tables", () => {
    expect(resolveDependencies([])).toEqual([]);
  });

  it("includes dependencies for Cards", () => {
    const result = resolveDependencies(["Cards"]);
    expect(result).toContain("Cards");
    expect(result).toContain("CategoryTags");
    expect(result).toContain("FreeResponseQuestions");
    expect(result).toContain("FillTheBlankQuestions");
    expect(result).toContain("MultipleChoiceQuestions");
  });

  it("preserves FK-safe order", () => {
    const result = resolveDependencies(["Cards"]);
    const cardIdx = result.indexOf("Cards");
    const tagsIdx = result.indexOf("CategoryTags");
    expect(tagsIdx).toBeLessThan(cardIdx);
  });
});

describe("backup round-trip", () => {
  let db: MockDb;

  beforeEach(() => {
    db = createInMemoryDb();
    mockGetDb.mockResolvedValue(db);
  });

  async function seedAllTables() {
    await db.run("INSERT INTO AiModels (Id, DisplayName, URL, ModelName, APIKey, Provider) VALUES (?, ?, ?, ?, ?, ?);", ["m1", "Gemini", "https://example.com", "gemini-pro", "key-1", "GoogleGemini"]);
    await db.run("INSERT INTO CustomPrompts (Id, Name, Prompt) VALUES (?, ?, ?);", ["p1", "Summarize", "Summarize this text"]);
    await db.run("INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);", ["tag-1", "Math"]);
    await db.run("INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);", ["tag-2", "Science"]);
    await db.run("INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId) VALUES (?, ?, ?, ?, ?);", ["b1", "Box 1", 60, null, null]);
    await db.run("INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId) VALUES (?, ?, ?, ?, ?);", ["b2", "Box 2", 300, null, "b1"]);
    await db.run("UPDATE Boxes SET NextBoxId = ? WHERE Id = ?;", ["b2", "b1"]);
    await db.run("INSERT INTO Cards (Id, BoxId, CategoryTagId, Topic, MarkdownContent, LastReviewUnixTime, NextReviewUnixTime, StartedLearningUnixTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?);", ["c1", "b1", "tag-1", "Algebra", "x + y = z", 1000, 2000, 500]);
    await db.run("INSERT INTO Cards (Id, BoxId, CategoryTagId, Topic, MarkdownContent, LastReviewUnixTime, NextReviewUnixTime, StartedLearningUnixTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?);", ["c2", "b2", "tag-2", "Physics", "F = ma", 1500, 2500, 600]);
    await db.run("INSERT INTO FreeResponseQuestions (Id, CardId, MarkdownQuestion, MarkdownAnswer, AskedTimes) VALUES (?, ?, ?, ?, ?);", ["q1", "c1", "What is x?", "x is a variable", 0]);
    await db.run("INSERT INTO FillTheBlankQuestions (Id, CardId, MarkdownQuestion, MarkdownAnswer, AskedTimes) VALUES (?, ?, ?, ?, ?);", ["fb1", "c1", "x _ y", "x + y", 0]);
    await db.run("INSERT INTO MultipleChoiceQuestions (Id, CardId, MarkdownQuestion, MarkdownOptionA, MarkdownOptionB, MarkdownOptionC, MarkdownOptionD, CorrectOption, AskedTimes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);", ["mc1", "c2", "What is 2+2?", "3", "4", "5", "6", "B", 2]);
  }

  it("exportTables exports all tables", async () => {
    await seedAllTables();
    const data = await exportTables({ tables: ["AiModels", "CustomPrompts", "CategoryTags", "Boxes", "Cards", "FreeResponseQuestions", "FillTheBlankQuestions", "MultipleChoiceQuestions"] });
    expect(data.AiModels).toHaveLength(1);
    expect(data.CustomPrompts).toHaveLength(1);
    expect(data.CategoryTags).toHaveLength(2);
    expect(data.Boxes).toHaveLength(2);
    expect(data.Cards).toHaveLength(2);
    expect(data.FreeResponseQuestions).toHaveLength(1);
    expect(data.FillTheBlankQuestions).toHaveLength(1);
    expect(data.MultipleChoiceQuestions).toHaveLength(1);
  });

  it("exportTables with category tag filter exports only matching cards and dependencies", async () => {
    await seedAllTables();
    const data = await exportTables({ tables: ["Cards"], categoryTagFilter: ["tag-1"] });
    expect(data.Cards).toHaveLength(1);
    expect(data.Cards![0].Id).toBe("c1");
    expect(data.CategoryTags).toHaveLength(1);
    expect(data.CategoryTags![0].Id).toBe("tag-1");
    expect(data.FreeResponseQuestions).toHaveLength(1);
    expect(data.FillTheBlankQuestions).toHaveLength(1);
    expect(data.MultipleChoiceQuestions).toEqual([]);
  });

  it("createBackupZip produces a valid zip", async () => {
    await seedAllTables();
    const data = await exportTables({ tables: ["CategoryTags", "Boxes", "Cards", "FreeResponseQuestions"] });
    const zipData = await createBackupZip(data);
    expect(zipData).toBeInstanceOf(Uint8Array);
    expect(zipData.length).toBeGreaterThan(0);
    const parsed = await parseBackupZip(zipData);
    expect(parsed.CategoryTags).toHaveLength(2);
  });

  it("parseBackupZip reads back what createBackupZip wrote", async () => {
    await seedAllTables();
    const data = await exportTables({ tables: ["CategoryTags", "Boxes", "Cards", "FreeResponseQuestions"] });
    const zipData = await createBackupZip(data);
    const parsed = await parseBackupZip(zipData);
    expect(parsed.CategoryTags).toEqual(data.CategoryTags);
    expect(parsed.Boxes).toEqual(data.Boxes);
    expect(parsed.Cards).toEqual(data.Cards);
    expect(parsed.FreeResponseQuestions).toEqual(data.FreeResponseQuestions);
  });

  it("parseBackupZip throws on invalid blob", async () => {
    const invalidBlob = new Blob(["not a zip"], { type: "text/plain" });
    await expect(parseBackupZip(invalidBlob)).rejects.toThrow();
  });

  it("importBackupZip restores data correctly after deletion", async () => {
    await seedAllTables();
    const data = await exportTables({ tables: ["CategoryTags", "Boxes", "Cards", "FreeResponseQuestions"] });

    await db.run("DELETE FROM FreeResponseQuestions;");
    await db.run("DELETE FROM Cards;");
    await db.run("UPDATE Boxes SET NextBoxId=NULL, PreviousBoxId=NULL;");
    await db.run("DELETE FROM Boxes;");
    await db.run("DELETE FROM CategoryTags;");

    const remaining = await db.query("SELECT COUNT(*) as cnt FROM CategoryTags;");
    expect((remaining.values?.[0] as Record<string, unknown>).cnt).toBe(0);

    await importBackupZip(data);

    const catTags = await db.query("SELECT * FROM CategoryTags ORDER BY Id;");
    expect(catTags.values).toHaveLength(2);

    const boxes = await db.query("SELECT * FROM Boxes ORDER BY Id;");
    expect(boxes.values).toHaveLength(2);
    const b1 = boxes.values?.[0] as Record<string, unknown>;
    const b2 = boxes.values?.[1] as Record<string, unknown>;
    expect(b1.NextBoxId).toBe("b2");
    expect(b2.PreviousBoxId).toBe("b1");

    const cards = await db.query("SELECT * FROM Cards ORDER BY Id;");
    expect(cards.values).toHaveLength(2);
    expect((cards.values?.[0] as Record<string, unknown>).BoxId).toBe("b1");

    const frqs = await db.query("SELECT * FROM FreeResponseQuestions;");
    expect(frqs.values).toHaveLength(1);
  });

  it("importBackupZip replaces existing data with matching IDs", async () => {
    await seedAllTables();
    const data = await exportTables({ tables: ["CategoryTags", "Boxes", "Cards"] });

    await db.run("UPDATE CategoryTags SET Name = ? WHERE Id = ?;", ["Renamed", "tag-1"]);
    await db.run("UPDATE Cards SET Topic = ? WHERE Id = ?;", ["Changed", "c1"]);

    await importBackupZip(data);

    const t1 = (await db.query("SELECT Name FROM CategoryTags WHERE Id = ?;", ["tag-1"])).values?.[0] as Record<string, unknown>;
    expect(t1.Name).toBe("Math");

    const c1 = (await db.query("SELECT Topic FROM Cards WHERE Id = ?;", ["c1"])).values?.[0] as Record<string, unknown>;
    expect(c1.Topic).toBe("Algebra");
  });

  it("full round-trip preserves all data", async () => {
    await seedAllTables();
    const data = await exportTables({ tables: ["AiModels", "CustomPrompts", "CategoryTags", "Boxes", "Cards", "FreeResponseQuestions", "FillTheBlankQuestions", "MultipleChoiceQuestions"] });
    const zipData = await createBackupZip(data);
    const parsed = await parseBackupZip(zipData);

    await db.run("DELETE FROM MultipleChoiceQuestions;");
    await db.run("DELETE FROM FillTheBlankQuestions;");
    await db.run("DELETE FROM FreeResponseQuestions;");
    await db.run("DELETE FROM Cards;");
    await db.run("UPDATE Boxes SET NextBoxId=NULL, PreviousBoxId=NULL;");
    await db.run("DELETE FROM Boxes;");
    await db.run("DELETE FROM CategoryTags;");
    await db.run("DELETE FROM CustomPrompts;");
    await db.run("DELETE FROM AiModels;");

    await importBackupZip(parsed);

    const checkAi = await db.query("SELECT * FROM AiModels;");
    expect((checkAi.values?.[0] as Record<string, unknown>).Id).toBe("m1");

    const checkFb = await db.query("SELECT * FROM FillTheBlankQuestions;");
    expect(checkFb.values).toHaveLength(1);

    const checkMc = await db.query("SELECT * FROM MultipleChoiceQuestions;");
    expect(checkMc.values).toHaveLength(1);
    expect((checkMc.values?.[0] as Record<string, unknown>).CorrectOption).toBe("B");

    const boxes = await db.query("SELECT * FROM Boxes ORDER BY Id;");
    expect((boxes.values?.[0] as Record<string, unknown>).NextBoxId).toBe("b2");
    expect((boxes.values?.[1] as Record<string, unknown>).PreviousBoxId).toBe("b1");
  });

  it("handles empty tables gracefully", async () => {
    const data = await exportTables({ tables: ["CategoryTags"] });
    expect(data.CategoryTags).toEqual([]);
    const zipData = await createBackupZip(data);
    const parsed = await parseBackupZip(zipData);
    expect(parsed.CategoryTags).toBeUndefined();
    await importBackupZip(parsed);
    const result = await db.query("SELECT * FROM CategoryTags;");
    expect(result.values).toHaveLength(0);
  });

  it("Boxes self-referential FKs survive round-trip", async () => {
    await db.run("INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId) VALUES (?, ?, ?, ?, ?);", ["box-a", "A", 30, null, null]);
    await db.run("INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId) VALUES (?, ?, ?, ?, ?);", ["box-b", "B", 60, null, "box-a"]);
    await db.run("INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId) VALUES (?, ?, ?, ?, ?);", ["box-c", "C", 120, null, "box-b"]);
    await db.run("UPDATE Boxes SET NextBoxId = ? WHERE Id = ?;", ["box-b", "box-a"]);
    await db.run("UPDATE Boxes SET NextBoxId = ? WHERE Id = ?;", ["box-c", "box-b"]);

    const data = await exportTables({ tables: ["Boxes"] });
    const zipData = await createBackupZip(data);
    const parsed = await parseBackupZip(zipData);

    await db.run("UPDATE Boxes SET NextBoxId=NULL, PreviousBoxId=NULL;");
    await db.run("DELETE FROM Boxes;");

    await importBackupZip(parsed);

    const rows = await db.query("SELECT * FROM Boxes ORDER BY Id;");
    expect(rows.values).toHaveLength(3);
    const a = rows.values?.[0] as Record<string, unknown>;
    const b = rows.values?.[1] as Record<string, unknown>;
    const c = rows.values?.[2] as Record<string, unknown>;
    expect(a.NextBoxId).toBe("box-b");
    expect(a.PreviousBoxId).toBeNull();
    expect(b.NextBoxId).toBe("box-c");
    expect(b.PreviousBoxId).toBe("box-a");
    expect(c.NextBoxId).toBeNull();
    expect(c.PreviousBoxId).toBe("box-b");
  });
});
