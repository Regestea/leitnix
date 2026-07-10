import { z } from "zod";
import type { CategoryTag } from "../../../shared/types/entities";

// ─── Empty default ─────────────────────────────────────────────────

export const EMPTY_TAG: CategoryTag = { Id: "", Name: "" };

// ─── Form validation ───────────────────────────────────────────────

export const categoryTagFormSchema = z.object({
  Name: z.string().trim().min(1, "Name is required."),
});

export type CategoryTagFormErrors = Partial<
  Record<keyof z.infer<typeof categoryTagFormSchema>, string>
>;

export function validateCategoryTagForm(
  tag: CategoryTag
): { success: boolean; errors: CategoryTagFormErrors } {
  const result = categoryTagFormSchema.safeParse({
    Name: tag.Name ?? "",
  });

  if (result.success) {
    return { success: true, errors: {} };
  }

  const errors: CategoryTagFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CategoryTagFormErrors;
    if (!errors[field]) errors[field] = issue.message;
  }
  return { success: false, errors };
}
