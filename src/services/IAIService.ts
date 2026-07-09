export interface IAIService {
  fetchStructuredAI<T>(options: {
    url: string;
    apiKey: string;
    modelName: string;
    schema: unknown;
    prompt: string;
    systemPrompt?: string;
    images?: string[];
  }): Promise<T>;
}
