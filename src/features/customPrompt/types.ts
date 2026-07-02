import type { CustomPrompt } from "../../db/schema";
import { z } from "zod";

export const EMPTY_PROMPT: CustomPrompt = {
  Id: "",
  Name: null,
  Prompt: null,
};

export const customPromptFormSchema = z.object({
  Name: z.string().trim().min(1, "Name is required."),
  Prompt: z.string().trim().min(1, "Prompt is required."),
});

export type CustomPromptFormErrors = Partial<
  Record<keyof z.infer<typeof customPromptFormSchema>, string>
>;

export function validateFormPrompt(prompt: CustomPrompt): {
  success: boolean;
  errors: CustomPromptFormErrors;
} {
  const result = customPromptFormSchema.safeParse({
    Name: prompt.Name ?? "",
    Prompt: prompt.Prompt ?? "",
  });

  if (result.success) {
    return { success: true, errors: {} };
  }

  const errors: CustomPromptFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CustomPromptFormErrors;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}
