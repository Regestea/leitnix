import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("openai", () => ({
  default: function MockOpenAI() {
    return {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };
  },
}));

const { mockResolveProviderBaseUrl } = vi.hoisted(() => ({
  mockResolveProviderBaseUrl: vi.fn(),
}));

vi.mock("../../../src/services/aiProviderConfig", () => ({
  resolveProviderBaseUrl: mockResolveProviderBaseUrl,
}));

const { mockAiModelRepository } = vi.hoisted(() => ({
  mockAiModelRepository: {
    getById: vi.fn(),
  },
}));

vi.mock("../../../src/repositories/AiModelRepository", () => ({
  aiModelRepository: mockAiModelRepository,
}));

import { sendChatMessage, sendChatMessageWithTools } from "../../../src/features/aiChat/aiChatService";

describe("sendChatMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAiModelRepository.getById.mockResolvedValue({
      Id: "m1",
      APIKey: "sk-test",
      ModelName: "gpt-4",
      Provider: "OpenAi",
    });
    mockResolveProviderBaseUrl.mockReturnValue("https://api.openai.com/v1");
  });

  it("returns the assistant content", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Hello, human!" } }],
    });

    const result = await sendChatMessage("m1", [
      { role: "user", content: "Hi" },
    ]);
    expect(result).toBe("Hello, human!");
  });

  it("throws when model is not found", async () => {
    mockAiModelRepository.getById.mockResolvedValue(null);

    await expect(
      sendChatMessage("nonexistent", [{ role: "user", content: "Hi" }]),
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
      sendChatMessage("m1", [{ role: "user", content: "Hi" }]),
    ).rejects.toThrow(/API key/i);
  });

  it("throws when response content is empty", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    await expect(
      sendChatMessage("m1", [{ role: "user", content: "Hi" }]),
    ).rejects.toThrow(/empty response/i);
  });
});

describe("sendChatMessageWithTools", () => {
  const mockExecuteTool = vi.fn<() => Promise<string>>();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAiModelRepository.getById.mockResolvedValue({
      Id: "m1",
      APIKey: "sk-test",
      ModelName: "gpt-4",
      Provider: "OpenAi",
    });
    mockResolveProviderBaseUrl.mockReturnValue("https://api.openai.com/v1");
  });

  it("returns content directly when no tool calls", async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        finish_reason: "stop",
        message: { content: "Final answer" },
      }],
    });

    const result = await sendChatMessageWithTools("m1", [], {
      tools: [],
      executeTool: mockExecuteTool,
    });
    expect(result).toBe("Final answer");
  });

  it("loops on tool_calls and returns final content", async () => {
    mockCreate
      .mockResolvedValueOnce({
        choices: [{
          finish_reason: "tool_calls",
          message: {
            content: null,
            tool_calls: [
              {
                id: "call-1",
                type: "function",
                function: { name: "get_weather", arguments: '{"city":"Paris"}' },
              },
            ],
          },
        }],
      })
      .mockResolvedValueOnce({
        choices: [{
          finish_reason: "stop",
          message: { content: "The weather in Paris is sunny." },
        }],
      });

    mockExecuteTool.mockResolvedValue('{"temperature": 22}');

    const result = await sendChatMessageWithTools("m1", [], {
      tools: [{ type: "function", function: { name: "get_weather", parameters: {} } }],
      executeTool: mockExecuteTool,
    });

    expect(result).toBe("The weather in Paris is sunny.");
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockExecuteTool).toHaveBeenCalledWith("get_weather", { city: "Paris" });
  });

  it("handles tool execution errors gracefully", async () => {
    mockCreate
      .mockResolvedValueOnce({
        choices: [{
          finish_reason: "tool_calls",
          message: {
            content: null,
            tool_calls: [
              {
                id: "call-1",
                type: "function",
                function: { name: "bad_tool", arguments: '{}' },
              },
            ],
          },
        }],
      })
      .mockResolvedValueOnce({
        choices: [{
          finish_reason: "stop",
          message: { content: "Error handled" },
        }],
      });

    mockExecuteTool.mockRejectedValue(new Error("Something broke"));

    const result = await sendChatMessageWithTools("m1", [], {
      tools: [],
      executeTool: mockExecuteTool,
    });

    expect(result).toBe("Error handled");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("throws when final content is empty after tool calls", async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        finish_reason: "stop",
        message: { content: null },
      }],
    });

    await expect(
      sendChatMessageWithTools("m1", [], { tools: [], executeTool: mockExecuteTool }),
    ).rejects.toThrow(/empty response/i);
  });
});
