import type { ITranslationService, TranslationResult } from "./ITranslationService";

const GOOGLE_TRANSLATE_URL = "https://translate.google.com/translate_a/single";

function buildUrl(text: string, targetLanguage: string): string {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: targetLanguage,
    dt: "t",
    q: text,
  });
  return `${GOOGLE_TRANSLATE_URL}?${params.toString()}`;
}

function parseTranslationResponse(
  responseContent: string,
  originalText: string,
): TranslationResult {
  try {
    const root: unknown[] = JSON.parse(responseContent);

    let translatedText = "";
    let detectedLanguage = "";

    if (Array.isArray(root) && root.length > 0) {
      const translationsArray = root[0];
      if (Array.isArray(translationsArray)) {
        for (const segment of translationsArray) {
          if (Array.isArray(segment) && segment.length > 0) {
            const segmentText = segment[0];
            if (typeof segmentText === "string") {
              translatedText += segmentText;
            }
          }
        }
      }

      if (root.length > 2) {
        const langElement = root[2];
        if (typeof langElement === "string") {
          detectedLanguage = langElement;
        }
      }
    }

    return {
      translatedText,
      detectedLanguage,
      originalText,
    };
  } catch (ex) {
    console.error("Failed to parse translation response", ex);
    throw new Error("Failed to parse translation response.");
  }
}

export class TranslationService implements ITranslationService {
  async translateAsync(
    text: string,
    targetLanguage: string,
    cancellationToken?: AbortSignal,
  ): Promise<TranslationResult> {
    if (!text?.trim()) {
      throw new Error("Text to translate cannot be null or empty.");
    }

    if (!targetLanguage?.trim()) {
      throw new Error("Target language cannot be null or empty.");
    }

    try {
      console.log(`Translating text to ${targetLanguage}`);

      const url = buildUrl(text, targetLanguage);
      const response = await fetch(url, { signal: cancellationToken });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseContent = await response.text();

      console.debug(`Translation API response: ${responseContent}`);

      return parseTranslationResponse(responseContent, text);
    } catch (ex) {
      if (ex instanceof DOMException && ex.name === "AbortError") {
        throw ex;
      }
      console.error("Error occurred during translation", ex);
      throw new Error("Failed to communicate with translation service.");
    }
  }
}

export const translationService: ITranslationService = new TranslationService();
