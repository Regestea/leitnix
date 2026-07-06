import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

interface AIServiceOptions<T> {
  url: string;
  apiKey: string;
  modelName: string;
  schema: z.ZodType<T>;
  prompt: string;
  systemPrompt?: string;
  images?: string[];
}


export async function fetchStructuredAI<T>(
  options: AIServiceOptions<T>
): Promise<T> {
  const { url, apiKey, modelName, schema, prompt, systemPrompt, images } = options;

  try {
    const client = new OpenAI({
      baseURL: url,
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });

    const userContent = images && images.length > 0
      ? [
          { type: 'text' as const, text: prompt },
          ...images.map((img) => ({
            type: 'image_url' as const,
            image_url: { url: img },
          })),
        ]
      : prompt;

    const completion = await client.chat.completions.parse({
      model: modelName,
      messages: [
        ...(systemPrompt
          ? [{ role: 'system' as const, content: systemPrompt }]
          : []),
        { role: 'user' as const, content: userContent },
      ],
      response_format: zodResponseFormat(schema, 'response'),
    });

    const parsed = completion.choices[0]?.message?.parsed;

    if (!parsed) {
      throw new Error('AI response could not be parsed against the schema.');
    }

    return parsed;
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
}

type SuccessResponse = {
  success: boolean;
  message?: string | null;
};

const testSchema: z.ZodType<SuccessResponse> = z.object({
  success: z.boolean(),
  message: z.string().nullable(),
});

export async function testApi(
  url: string,
  apiKey: string,
  modelName: string
): Promise<boolean> {
  try {
    const result = await fetchStructuredAI<SuccessResponse>({
      url,
      apiKey,
      modelName,
      schema: testSchema,
      systemPrompt: 'You must respond only with structured JSON matching the given schema.',
      prompt: 'Respond with a JSON object where "success" is true and "message" is "API connection working".',
    });

    console.log('testApi result:', result.success);
    return result.success === true;
  } catch (error) {
    console.error('testApi failed:', error);
    return false;
  }
}