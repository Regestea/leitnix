import { z } from "zod";
import { fetchStructuredAIByModelId } from "./aiModelClient";
import { aiModelRepository } from "../repositories/AiModelRepository";
import { LANGUAGES } from "../shared/constants/languages";

const aiTranslationResponseSchema = z.object({
  translatedText: z.string(),
});

const languageNames = new Map(LANGUAGES);

function languageName(code: string): string {
  return languageNames.get(code) ?? code;
}

export async function translateWithAI(
  text: string,
  targetLanguage: string,
): Promise<string> {
  const models = await aiModelRepository.getAll();

  if (models.length === 0) {
    throw new Error(
      "No AI model is configured. Add an AI model in Settings to use AI translation.",
    );
  }

  const response = await fetchStructuredAIByModelId<{
    translatedText: string;
  }>({
    modelId: models[0].Id,
    schema: aiTranslationResponseSchema,
    systemPrompt: [
      "You are a professional translator.",
      `Translate the given text into ${languageName(targetLanguage)}.`,
      "Preserve the original Markdown structure (headings, lists, tables, links, emphasis, math) and any raw HTML exactly as-is; only translate the prose.",
      "Do not translate code blocks, inline code, URLs, or placeholders that look like @@CODE_0@@.",
    ].join("\n"),
    prompt: text,
  });

  return response.translatedText;
}