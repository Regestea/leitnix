import { describe, it, expect, beforeEach, vi } from "vitest";
import type { MockDb } from "../dbTestHelper";
import { createInMemoryDb } from "../dbTestHelper";

const mockGetDb = vi.fn<() => Promise<MockDb>>();

vi.mock("../../src/db/connection", () => ({
  getDb: () => mockGetDb(),
}));

import { SettingRepository } from "../../src/repositories/SettingRepository";

describe("SettingRepository", () => {
  let db: MockDb;

  beforeEach(() => {
    db = createInMemoryDb();
    mockGetDb.mockResolvedValue(db);
  });

  it("returns null when no setting exists", async () => {
    const repo = new SettingRepository();
    const result = await repo.get();
    expect(result).toBeNull();
  });

  it("returns the setting when one exists", async () => {
    await db.run(
      "INSERT INTO Setting (WrongAnswerPunishment, Notification) VALUES (?, ?);",
      ["JumpOneBoxBack", 1],
    );

    const repo = new SettingRepository();
    const result = await repo.get();

    expect(result).not.toBeNull();
    expect(result!.WrongAnswerPunishment).toBe("JumpOneBoxBack");
    expect(result!.Notification).toBe(1);
  });
});
