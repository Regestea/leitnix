import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";

const { mockFetchStructuredAI } = vi.hoisted(() => ({
  mockFetchStructuredAI: vi.fn(),
}));

vi.mock("../../src/services/aiClient", () => ({
  aiService: {
    fetchStructuredAI: mockFetchStructuredAI,
  },
}));

const { mockResolveProviderBaseUrl } = vi.hoisted(() => ({
  mockResolveProviderBaseUrl: vi.fn(),
}));

vi.mock("../../src/services/aiProviderConfig.ts", () => ({
  resolveProviderBaseUrl: mockResolveProviderBaseUrl,
}));

const { mockAiModelRepository } = vi.hoisted(() => ({
  mockAiModelRepository: {
    getById: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../src/repositories/AiModelRepository", () => ({
  aiModelRepository: mockAiModelRepository,
}));

import { fetchStructuredAIByModelId } from "../../src/services/aiModelClient";

describe("fetchStructuredAIByModelId", () => {
  const schema = z.object({ result: z.string() });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to aiService.fetchStructuredAI with correct params", async () => {
    mockAiModelRepository.getById.mockResolvedValue({
      Id: "m1",
      APIKey: "sk-test",
      ModelName: "gpt-4",
      Provider: "OpenAi",
    });
    mockResolveProviderBaseUrl.mockReturnValue("https://api.openai.com/v1");
    mockFetchStructuredAI.mockResolvedValue({ result: "success" });

    const result = await fetchStructuredAIByModelId({
      modelId: "m1",
      schema,
      prompt: "Do something",
      systemPrompt: "Be helpful",
    });

    expect(result).toEqual({ result: "success" });
    expect(mockFetchStructuredAI).toHaveBeenCalledWith({
      url: "https://api.openai.com/v1",
      apiKey: "sk-test",
      modelName: "gpt-4",
      schema,
      prompt: "Do something",
      systemPrompt: "Be helpful",
      images: undefined,
    });
  });

  it("throws when model is not found", async () => {
    mockAiModelRepository.getById.mockResolvedValue(null);

    await expect(
      fetchStructuredAIByModelId({ modelId: "nonexistent", schema, prompt: "Test" }),
    ).rejects.toThrow(/not found/i);
  });

  it("throws when model has no API key", async () => {
    mockAiModelRepository.getById.mockResolvedValue({
      Id: "m1",
      APIKey: null,
      ModelName: "gpt-4",
      Provider: "OpenAi",
    });

    await expect(
      fetchStructuredAIByModelId({ modelId: "m1", schema, prompt: "Test" }),
    ).rejects.toThrow(/API key/i);
  });

  it("throws when model has no model name", async () => {
    mockAiModelRepository.getById.mockResolvedValue({
      Id: "m1",
      APIKey: "sk-test",
      ModelName: null,
      Provider: "OpenAi",
    });

    await expect(
      fetchStructuredAIByModelId({ modelId: "m1", schema, prompt: "Test" }),
    ).rejects.toThrow(/model name/i);
  });

  it("passes images when provided", async () => {
    mockAiModelRepository.getById.mockResolvedValue({
      Id: "m1",
      APIKey: "sk-test",
      ModelName: "gpt-4",
      Provider: "OpenAi",
    });
    mockResolveProviderBaseUrl.mockReturnValue("https://api.openai.com/v1");
    mockFetchStructuredAI.mockResolvedValue({ result: "ok" });

    await fetchStructuredAIByModelId({
      modelId: "m1",
      schema,
      prompt: "Describe",
      images: ["img1"],
    });

    expect(mockFetchStructuredAI).toHaveBeenCalledWith(
      expect.objectContaining({ images: ["img1"] }),
    );
  });
});
