import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";

const { mockParse, mockCreate } = vi.hoisted(() => ({
  mockParse: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("openai", () => ({
  default: function MockOpenAI() {
    return {
      chat: {
        completions: {
          parse: mockParse,
          create: mockCreate,
        },
      },
    };
  },
}));

vi.mock("openai/helpers/zod", () => ({
  zodResponseFormat: vi.fn(() => ({ type: "json_schema" })),
}));

import { aiService, testApi } from "../../src/services/aiClient";

describe("aiService.fetchStructuredAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed result from AI response", async () => {
    mockParse.mockResolvedValue({
      choices: [{ message: { parsed: { topic: "Test", markdownContent: "# Content" } } }],
    });

    const schema = z.object({ topic: z.string(), markdownContent: z.string() });
    const result = await aiService.fetchStructuredAI({
      url: "https://example.com/v1",
      apiKey: "sk-test",
      modelName: "gpt-4",
      schema,
      prompt: "Generate content",
    });

    expect(result).toEqual({ topic: "Test", markdownContent: "# Content" });
  });

  it("throws when parsed result is null", async () => {
    mockParse.mockResolvedValue({
      choices: [{ message: { parsed: null } }],
    });

    const schema = z.object({ topic: z.string() });
    await expect(
      aiService.fetchStructuredAI({
        url: "https://example.com/v1",
        apiKey: "sk-test",
        modelName: "gpt-4",
        schema,
        prompt: "Test",
      }),
    ).rejects.toThrow(/could not be parsed/i);
  });

  it("includes system prompt when provided", async () => {
    mockParse.mockResolvedValue({
      choices: [{ message: { parsed: { topic: "T" } } }],
    });

    const schema = z.object({ topic: z.string() });
    await aiService.fetchStructuredAI({
      url: "https://example.com/v1",
      apiKey: "sk-test",
      modelName: "gpt-4",
      schema,
      prompt: "Test",
      systemPrompt: "You are an expert",
    });

    const callArgs = mockParse.mock.calls[0][0];
    expect(callArgs.messages[0].role).toBe("system");
    expect(callArgs.messages[0].content).toBe("You are an expert");
  });

  it("includes images as image_url content", async () => {
    mockParse.mockResolvedValue({
      choices: [{ message: { parsed: { topic: "T" } } }],
    });

    const schema = z.object({ topic: z.string() });
    await aiService.fetchStructuredAI({
      url: "https://example.com/v1",
      apiKey: "sk-test",
      modelName: "gpt-4",
      schema,
      prompt: "Describe this",
      images: ["data:image/png;base64,abc"],
    });

    const callArgs = mockParse.mock.calls[0][0];
    const userContent = callArgs.messages[callArgs.messages.length - 1].content;
    expect(userContent).toBeInstanceOf(Array);
    expect(userContent[0]).toEqual({ type: "text", text: "Describe this" });
    expect(userContent[1]).toEqual({
      type: "image_url",
      image_url: { url: "data:image/png;base64,abc" },
    });
  });
});

describe("testApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when API responds with success", async () => {
    mockParse.mockResolvedValue({
      choices: [{ message: { parsed: { success: true, message: "API connection working" } } }],
    });

    const result = await testApi("https://example.com/v1", "sk-test", "gpt-4");
    expect(result).toBe(true);
  });

  it("returns false when API call fails", async () => {
    mockParse.mockRejectedValue(new Error("Connection failed"));

    const result = await testApi("https://example.com/v1", "sk-test", "gpt-4");
    expect(result).toBe(false);
  });
});
