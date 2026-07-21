import { describe, it, expect } from "vitest";
import {
  PROVIDER_BASE_URLS,
  resolveProviderBaseUrl,
} from "../../src/services/aiProviderConfig";
import type { AiModel } from "../../src/db/entities";

describe("PROVIDER_BASE_URLS", () => {
  it("contains all non-OpenAiCompatible providers", () => {
    expect(PROVIDER_BASE_URLS.GoogleGemini).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai/",
    );
    expect(PROVIDER_BASE_URLS.OpenRouter).toBe(
      "https://openrouter.ai/api/v1",
    );
    expect(PROVIDER_BASE_URLS.AvalAi).toBe("https://api.avalai.ir/v1");
    expect(PROVIDER_BASE_URLS.OpenAi).toBe("https://api.openai.com/v1");
  });
});

describe("resolveProviderBaseUrl", () => {
  it.each([
    { provider: "GoogleGemini", expected: "https://generativelanguage.googleapis.com/v1beta/openai/" },
    { provider: "OpenRouter", expected: "https://openrouter.ai/api/v1" },
    { provider: "AvalAi", expected: "https://api.avalai.ir/v1" },
    { provider: "OpenAi", expected: "https://api.openai.com/v1" },
  ] as const)("returns $expected for $provider", ({ provider, expected }) => {
    const model = {
      Id: "m1",
      Provider: provider,
      URL: null,
    } as AiModel;
    expect(resolveProviderBaseUrl(model)).toBe(expected);
  });

  it("returns model.URL for OpenAiCompatible when URL is set", () => {
    const model = {
      Id: "m1",
      Provider: "OpenAiCompatible",
      URL: "https://custom.example.com/v1",
    } as AiModel;
    expect(resolveProviderBaseUrl(model)).toBe(
      "https://custom.example.com/v1",
    );
  });

  it("throws for OpenAiCompatible when URL is not set", () => {
    const model = {
      Id: "m1",
      Provider: "OpenAiCompatible",
      URL: null,
    } as AiModel;
    expect(() => resolveProviderBaseUrl(model)).toThrow(
      /no URL configured/i,
    );
  });
});
