export interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  originalText: string;
}

export interface ITranslationService {
  translateAsync(
    text: string,
    targetLanguage: string,
    cancellationToken?: AbortSignal,
  ): Promise<TranslationResult>;
}
