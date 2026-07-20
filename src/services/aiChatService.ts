import OpenAI from 'openai';
import { resolveProviderBaseUrl } from './aiProviderConfig';
import { aiModelRepository } from '../repositories/AiModelRepository';
import type { IAiModelRepository } from '../iRepositories/IAiModelRepository';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolCallConfig {
  tools: OpenAI.ChatCompletionTool[];
  executeTool: (name: string, args: Record<string, unknown>) => Promise<string>;
}

async function getClient(modelId: string): Promise<{ client: OpenAI; modelName: string }> {
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

  return { client, modelName: model.ModelName };
}

export async function sendChatMessage(
  modelId: string,
  messages: ChatMessage[]
): Promise<string> {
  const { client, modelName } = await getClient(modelId);

  const completion = await client.chat.completions.create({
    model: modelName,
    messages: messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error('AI returned an empty response.');
  }

  return content;
}

export async function sendChatMessageWithTools(
  modelId: string,
  messages: ChatMessage[],
  config: ToolCallConfig,
): Promise<string> {
  const { client, modelName } = await getClient(modelId);

  const apiMessages: OpenAI.ChatCompletionMessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let response = await client.chat.completions.create({
    model: modelName,
    messages: apiMessages,
    tools: config.tools,
  });

  let choice = response.choices[0];

  while (choice.finish_reason === 'tool_calls') {
    const assistantMsg = choice.message;

    apiMessages.push({
      role: 'assistant',
      content: assistantMsg.content || null,
      tool_calls: assistantMsg.tool_calls!,
    } as OpenAI.ChatCompletionAssistantMessageParam);

    for (const toolCall of assistantMsg.tool_calls!) {
      if (toolCall.type !== 'function') continue;
      const { name, arguments: argsStr } = toolCall.function;
      let result: string;
      try {
        const args = JSON.parse(argsStr);
        result = await config.executeTool(name, args);
      } catch (err) {
        result = JSON.stringify({ error: `Tool '${name}' failed: ${err}` });
      }

      apiMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    response = await client.chat.completions.create({
      model: modelName,
      messages: apiMessages,
      tools: config.tools,
    });

    choice = response.choices[0];
  }

  const content = choice.message?.content;
  if (!content) {
    throw new Error('AI returned an empty response.');
  }

  return content;
}
