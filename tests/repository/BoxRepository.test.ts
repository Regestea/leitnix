import { describe, it, expect, beforeEach, vi } from "vitest";
import type { MockDb } from "../dbTestHelper";
import { createInMemoryDb } from "../dbTestHelper";

const mockGetDb = vi.fn<() => Promise<MockDb>>();

vi.mock("../../src/db/connection", () => ({
  getDb: () => mockGetDb(),
}));

import { BoxRepository } from "../../src/repositories/BoxRepository";

describe("BoxRepository", () => {
  let db: MockDb;

  beforeEach(() => {
    db = createInMemoryDb();
    mockGetDb.mockResolvedValue(db);
  });

  it("getById returns null for non-existent id", async () => {
    const repo = new BoxRepository();
    const result = await repo.getById("non-existent");
    expect(result).toBeNull();
  });

  it("getFirst and getFinish return null when no boxes exist", async () => {
    const repo = new BoxRepository();
    expect(await repo.getFirst()).toBeNull();
    expect(await repo.getFinish()).toBeNull();
  });

  it("getChainOrdered returns empty array when no boxes exist", async () => {
    const repo = new BoxRepository();
    const result = await repo.getChainOrdered();
    expect(result).toEqual([]);
  });

  it("create inserts a box and chains it correctly", async () => {
    const repo = new BoxRepository();

    const box1Id = "box-1";
    await repo.create({ Id: box1Id, Name: "box1", RepeatIntervalSeconds: 60, NextBoxId: null, PreviousBoxId: null });

    const first = await repo.getFirst();
    expect(first).not.toBeNull();
    expect(first!.Id).toBe(box1Id);

    const chain = await repo.getChainOrdered();
    expect(chain).toHaveLength(1);
    expect(chain[0].Name).toBe("box1");
  });

  it("create inserts a second box after the first", async () => {
    const repo = new BoxRepository();

    const box1Id = crypto.randomUUID();
    const box2Id = crypto.randomUUID();

    await repo.create({ Id: box1Id, Name: "box1", RepeatIntervalSeconds: 60, NextBoxId: null, PreviousBoxId: null });
    await repo.create({ Id: box2Id, Name: "box2", RepeatIntervalSeconds: 120, NextBoxId: null, PreviousBoxId: null });

    const chain = await repo.getChainOrdered();
    expect(chain).toHaveLength(2);
    expect(chain[0].Id).toBe(box1Id);
    expect(chain[1].Id).toBe(box2Id);
    expect(chain[0].NextBoxId).toBe(box2Id);
    expect(chain[1].PreviousBoxId).toBe(box1Id);
  });

  it("create inserts before finish box when one exists", async () => {
    const repo = new BoxRepository();

    const b1 = crypto.randomUUID();
    const finishId = crypto.randomUUID();

    await repo.create({ Id: b1, Name: "box1", RepeatIntervalSeconds: 60, NextBoxId: null, PreviousBoxId: null });
    await db.run(
      `INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId)
       VALUES (?, ?, ?, ?, ?);`,
      [finishId, "finish", 0, null, b1],
    );
    await db.run("UPDATE Boxes SET NextBoxId = ? WHERE Id = ?;", [finishId, b1]);

    const newBoxId = crypto.randomUUID();
    await repo.create({ Id: newBoxId, Name: "newbox", RepeatIntervalSeconds: 30, NextBoxId: null, PreviousBoxId: null });

    const chain = await repo.getChainOrdered();
    expect(chain).toHaveLength(3);
    expect(chain[0].Id).toBe(b1);
    expect(chain[1].Id).toBe(newBoxId);
    expect(chain[2].Id).toBe(finishId);
  });

  it("update changes name and repeat interval", async () => {
    const repo = new BoxRepository();

    const boxId = crypto.randomUUID();
    await repo.create({ Id: boxId, Name: "old", RepeatIntervalSeconds: 60, NextBoxId: null, PreviousBoxId: null });

    await repo.update({ Id: boxId, Name: "new-name", RepeatIntervalSeconds: 999, NextBoxId: null, PreviousBoxId: null });

    const updated = await repo.getById(boxId);
    expect(updated!.Name).toBe("new-name");
    expect(updated!.RepeatIntervalSeconds).toBe(999);
  });

  it("getCardCounts returns counts grouped by box", async () => {
    const repo = new BoxRepository();

    const boxId = crypto.randomUUID();
    await repo.create({ Id: boxId, Name: "box1", RepeatIntervalSeconds: 60, NextBoxId: null, PreviousBoxId: null });
    await db.run(
      "INSERT INTO Cards (Id, BoxId, CategoryTagId, Topic, MarkdownContent) VALUES (?, ?, ?, ?, ?);",
      ["card-1", boxId, null, "Topic 1", "Content 1"],
    );
    await db.run(
      "INSERT INTO Cards (Id, BoxId, CategoryTagId, Topic, MarkdownContent) VALUES (?, ?, ?, ?, ?);",
      ["card-2", boxId, null, "Topic 2", "Content 2"],
    );

    const counts = await repo.getCardCounts();
    expect(counts.get(boxId)).toBe(2);
  });

  it("delete removes a box and relinks neighbors", async () => {
    const repo = new BoxRepository();

    const b1 = crypto.randomUUID();
    const b2 = crypto.randomUUID();
    const b3 = crypto.randomUUID();

    await repo.create({ Id: b1, Name: "box1", RepeatIntervalSeconds: 60, NextBoxId: null, PreviousBoxId: null });
    await repo.create({ Id: b2, Name: "box2", RepeatIntervalSeconds: 120, NextBoxId: null, PreviousBoxId: null });
    await repo.create({ Id: b3, Name: "box3", RepeatIntervalSeconds: 240, NextBoxId: null, PreviousBoxId: null });

    await repo.delete(b2);

    const chain = await repo.getChainOrdered();
    expect(chain).toHaveLength(2);
    expect(chain[0].Id).toBe(b1);
    expect(chain[1].Id).toBe(b3);
    expect(chain[0].NextBoxId).toBe(b3);
    expect(chain[1].PreviousBoxId).toBe(b1);
  });

  it("delete moves cards to the previous box", async () => {
    const repo = new BoxRepository();

    const b1 = crypto.randomUUID();
    const b2 = crypto.randomUUID();
    await repo.create({ Id: b1, Name: "box1", RepeatIntervalSeconds: 60, NextBoxId: null, PreviousBoxId: null });
    await repo.create({ Id: b2, Name: "box2", RepeatIntervalSeconds: 120, NextBoxId: null, PreviousBoxId: null });

    await db.run(
      "INSERT INTO Cards (Id, BoxId, Topic, MarkdownContent) VALUES (?, ?, ?, ?);",
      ["card-1", b2, "Topic", "Content"],
    );

    await repo.delete(b2);

    const cardResult = await db.query("SELECT BoxId FROM Cards WHERE Id = ?;", ["card-1"]);
    const row = cardResult.values[0] as { BoxId: string };
    expect(row.BoxId).toBe(b1);
  });
});
