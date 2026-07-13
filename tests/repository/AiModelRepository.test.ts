import { describe, it, expect, beforeEach, vi } from "vitest";
import type { MockDb } from "../dbTestHelper";
import { createInMemoryDb } from "../dbTestHelper";

const mockGetDb = vi.fn<() => Promise<MockDb>>();

vi.mock("../../src/db/connection", () => ({
  getDb: () => mockGetDb(),
}));

import { AiModelRepository } from "../../src/repositories/AiModelRepository";

describe("AiModelRepository", () => {
  let db: MockDb;

  beforeEach(() => {
    db = createInMemoryDb();
    mockGetDb.mockResolvedValue(db);
  });

  it("getAll returns empty array when no models exist", async () => {
    const repo = new AiModelRepository();
    const result = await repo.getAll();
    expect(result).toEqual([]);
  });

  it("create and getById work correctly", async () => {
    const repo = new AiModelRepository();
    const model = {
      Id: "model-1",
      DisplayName: "GPT-4",
      URL: "https://api.openai.com",
      ModelName: "gpt-4",
      APIKey: "sk-test",
      Provider: "OpenAi" as const,
    };

    await repo.create(model);
    const result = await repo.getById("model-1");

    expect(result).not.toBeNull();
    expect(result!.Id).toBe("model-1");
    expect(result!.DisplayName).toBe("GPT-4");
    expect(result!.Provider).toBe("OpenAi");
  });

  it("getById returns null for non-existent id", async () => {
    const repo = new AiModelRepository();
    const result = await repo.getById("non-existent");
    expect(result).toBeNull();
  });

  it("getAll returns all created models", async () => {
    const repo = new AiModelRepository();
    await repo.create({ Id: "m1", DisplayName: "Model A", URL: null, ModelName: null, APIKey: null, Provider: "OpenRouter" });
    await repo.create({ Id: "m2", DisplayName: "Model B", URL: null, ModelName: null, APIKey: null, Provider: "GoogleGemini" });

    const result = await repo.getAll();
    expect(result).toHaveLength(2);
  });

  it("update modifies an existing model", async () => {
    const repo = new AiModelRepository();
    await repo.create({ Id: "m1", DisplayName: "Old Name", URL: null, ModelName: null, APIKey: null, Provider: "OpenAi" });

    await repo.update({ Id: "m1", DisplayName: "New Name", URL: "https://new.url", ModelName: "gpt-5", APIKey: "sk-new", Provider: "OpenAi" });

    const result = await repo.getById("m1");
    expect(result!.DisplayName).toBe("New Name");
    expect(result!.URL).toBe("https://new.url");
  });

  it("delete removes a model", async () => {
    const repo = new AiModelRepository();
    await repo.create({ Id: "m1", DisplayName: "To Delete", URL: null, ModelName: null, APIKey: null, Provider: "AvalAi" });

    await repo.delete("m1");
    const result = await repo.getById("m1");
    expect(result).toBeNull();
  });
});
