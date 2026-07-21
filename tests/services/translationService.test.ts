import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn<() => Promise<Response>>();
vi.stubGlobal("fetch", mockFetch);

import { translationService } from "../../src/services/translationService";

function mockResponse(body: string, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    text: () => Promise.resolve(body),
  } as Response;
}

describe("TranslationService", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("translateAsync", () => {
    it("returns translated text and detected language", async () => {
      const googleResponse = JSON.stringify([
        [["Hola mundo", "Hello world"]],
        null,
        "en",
      ]);
      mockFetch.mockResolvedValue(mockResponse(googleResponse));

      const result = await translationService.translateAsync(
        "Hello world",
        "es",
      );

      expect(result.translatedText).toBe("Hola mundo");
      expect(result.detectedLanguage).toBe("en");
      expect(result.originalText).toBe("Hello world");
    });

    it("throws on empty text", async () => {
      await expect(
        translationService.translateAsync("", "es"),
      ).rejects.toThrow(/cannot be null or empty/i);
    });

    it("throws on empty target language", async () => {
      await expect(
        translationService.translateAsync("Hello", ""),
      ).rejects.toThrow(/cannot be null or empty/i);
    });

    it("throws on HTTP error", async () => {
      mockFetch.mockResolvedValue(mockResponse("", false, 500));

      await expect(
        translationService.translateAsync("Hello", "es"),
      ).rejects.toThrow(/failed to communicate/i);
    });

    it("re-throws AbortError", async () => {
      const abortError = new DOMException("The operation was aborted", "AbortError");
      mockFetch.mockRejectedValue(abortError);

      await expect(
        translationService.translateAsync("Hello", "es"),
      ).rejects.toThrow(abortError);
    });

    it("wraps other errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network failure"));

      await expect(
        translationService.translateAsync("Hello", "es"),
      ).rejects.toThrow(/failed to communicate/i);
    });

    it("builds correct URL", async () => {
      const googleResponse = JSON.stringify([
        [["Bonjour", "Hello"]],
        null,
        "en",
      ]);
      mockFetch.mockResolvedValue(mockResponse(googleResponse));

      await translationService.translateAsync("Hello", "fr");

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("https://translate.google.com/translate_a/single");
      expect(calledUrl).toContain("client=gtx");
      expect(calledUrl).toContain("sl=auto");
      expect(calledUrl).toContain("tl=fr");
      expect(calledUrl).toContain("q=Hello");
    });
  });

  describe("detectLanguageAsync", () => {
    it("returns detected language from response", async () => {
      const googleResponse = JSON.stringify([
        [["Bonjour", "Hello"]],
        null,
        "fr",
      ]);
      mockFetch.mockResolvedValue(mockResponse(googleResponse));

      const result = await translationService.detectLanguageAsync(
        "Bonjour le monde",
      );

      expect(result).toBe("fr");
    });

    it("falls back to en on HTTP error", async () => {
      mockFetch.mockResolvedValue(mockResponse("", false, 500));

      const result = await translationService.detectLanguageAsync("Hello");

      expect(result).toBe("en");
    });

    it("returns en for empty text", async () => {
      const result = await translationService.detectLanguageAsync("");

      expect(result).toBe("en");
    });

    it("returns en for whitespace-only text", async () => {
      const result = await translationService.detectLanguageAsync("   ");

      expect(result).toBe("en");
    });
  });
});
