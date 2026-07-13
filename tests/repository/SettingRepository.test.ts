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
      "INSERT INTO Setting (Id, WrongAnswerPunishment) VALUES (?, ?);",
      ["test-setting", "JumpOneBoxBack"],
    );

    const repo = new SettingRepository();
    const result = await repo.get();

    expect(result).not.toBeNull();
    expect(result!.Id).toBe("test-setting");
    expect(result!.WrongAnswerPunishment).toBe("JumpOneBoxBack");
  });
});
