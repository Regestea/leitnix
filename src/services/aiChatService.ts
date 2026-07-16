import OpenAI from 'openai';
import { resolveProviderBaseUrl } from './aiProviderConfig';
import { aiModelRepository } from '../repositories/AiModelRepository';
import type { IAiModelRepository } from '../iRepositories/IAiModelRepository';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendChatMessage(
  modelId: string,
  messages: ChatMessage[]
): Promise<string> {
  const repository: IAiModelRepository = aiModelRepository;
  const model = await repository.getById(modelId);

  if (!model) {
    throw new Error(`AI model with id "${modelId}" was not found.`);
  }
  if (!model.APIKey) {
    throw new Error(`AI model "${model.DisplayName ?? modelId}" has no API key configured.`);
  }
  if (!model.ModelName) {
    throw new Error(`AI model "${model.DisplayName ?? modelId}" has no model name configured.`);
  }

  const url = resolveProviderBaseUrl(model);

  const client = new OpenAI({
    baseURL: url,
    apiKey: model.APIKey,
    dangerouslyAllowBrowser: true,
  });

  const completion = await client.chat.completions.create({
    model: model.ModelName,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error('AI returned an empty response.');
  }

  return content;
}
