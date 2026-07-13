import { describe, it, expect, beforeEach, vi } from "vitest";
import type { MockDb } from "../dbTestHelper";
import { createInMemoryDb } from "../dbTestHelper";

const mockGetDb = vi.fn<() => Promise<MockDb>>();

vi.mock("../../src/db/connection", () => ({
  getDb: () => mockGetDb(),
}));

import { CustomPromptRepository } from "../../src/repositories/CustomPromptRepository";

describe("CustomPromptRepository", () => {
  let db: MockDb;

  beforeEach(() => {
    db = createInMemoryDb();
    mockGetDb.mockResolvedValue(db);
  });

  it("getAll returns empty array when no prompts exist", async () => {
    const repo = new CustomPromptRepository();
    const result = await repo.getAll();
    expect(result).toEqual([]);
  });

  it("getById returns null for non-existent id", async () => {
    const repo = new CustomPromptRepository();
    const result = await repo.getById("non-existent");
    expect(result).toBeNull();
  });

  it("create and getById work correctly", async () => {
    const repo = new CustomPromptRepository();
    await repo.create({ Id: "p1", Name: "Test Prompt", Prompt: "You are a helpful assistant." });

    const result = await repo.getById("p1");
    expect(result).not.toBeNull();
    expect(result!.Name).toBe("Test Prompt");
    expect(result!.Prompt).toBe("You are a helpful assistant.");
  });

  it("getAll returns all prompts", async () => {
    const repo = new CustomPromptRepository();
    await repo.create({ Id: "p1", Name: "Prompt 1", Prompt: "Prompt 1 content" });
    await repo.create({ Id: "p2", Name: "Prompt 2", Prompt: "Prompt 2 content" });

    const result = await repo.getAll();
    expect(result).toHaveLength(2);
  });

  it("update modifies an existing prompt", async () => {
    const repo = new CustomPromptRepository();
    await repo.create({ Id: "p1", Name: "Old Name", Prompt: "Old prompt" });

    await repo.update({ Id: "p1", Name: "New Name", Prompt: "Updated prompt" });

    const result = await repo.getById("p1");
    expect(result!.Name).toBe("New Name");
    expect(result!.Prompt).toBe("Updated prompt");
  });

  it("delete removes a prompt", async () => {
    const repo = new CustomPromptRepository();
    await repo.create({ Id: "p1", Name: "To Delete", Prompt: "Will be deleted" });

    await repo.delete("p1");
    const result = await repo.getById("p1");
    expect(result).toBeNull();
  });
});
