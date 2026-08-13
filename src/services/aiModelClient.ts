import type { z } from "zod";
import { aiService } from "./aiClient";
import { resolveProviderBaseUrl } from "./aiProviderConfig.ts";
import { aiModelRepository } from "../repositories/AiModelRepository";
import type { IAiModelRepository } from "../repositories/AiModelRepository";

interface FetchStructuredAIByModelIdOptions<T> {
  modelId: string;
  schema: z.ZodType<T>;
  prompt: string;
  systemPrompt?: string;
  images?: string[];
}

export async function fetchStructuredAIByModelId<T>(
  options: FetchStructuredAIByModelIdOptions<T>
): Promise<T> {
  const { modelId, schema, prompt, systemPrompt, images } = options;

  const repository: IAiModelRepository = aiModelRepository;
  const model = await repository.getById(modelId);

  if (!model) {
    throw new Error(`AI model with id "${modelId}" was not found.`);
  }
  if (!model.APIKey) {
    throw new Error(
      `AI model "${model.DisplayName ?? modelId}" has no API key configured.`
    );
  }
  if (!model.ModelName) {
    throw new Error(
      `AI model "${model.DisplayName ?? modelId}" has no model name configured.`
    );
  }

  const url = resolveProviderBaseUrl(model);

  return aiService.fetchStructuredAI<T>({
    url,
    apiKey: model.APIKey,
    modelName: model.ModelName,
    schema,
    prompt,
    systemPrompt,
    images,
  });
}
