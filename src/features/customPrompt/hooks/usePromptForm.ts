import { useState } from "react";
import { EMPTY_PROMPT, validateFormPrompt } from "../types";
import type { CustomPromptFormErrors } from "../types";
import type { CustomPrompt } from "../../../shared/types/entities";


export function usePromptForm() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formPrompt, setFormPrompt] = useState<CustomPrompt>(EMPTY_PROMPT);
  const [formErrors, setFormErrors] = useState<CustomPromptFormErrors>({});

  const openAdd = () => {
    setEditingId(null);
    setFormPrompt(EMPTY_PROMPT);
    setFormErrors({});
  };

  const openEdit = (prompt: CustomPrompt) => {
    setEditingId(prompt.Id);
    setFormPrompt(prompt);
    setFormErrors({});
  };

  const reset = () => {
    setEditingId(null);
    setFormPrompt(EMPTY_PROMPT);
    setFormErrors({});
  };

  const handleFieldChange = (
    field: Exclude<keyof CustomPrompt, "Id">,
    value: string,
  ) => {
    setFormPrompt((prev: CustomPrompt) => ({
      ...prev,
      [field]: value,
    }));
    setFormErrors((prev: CustomPromptFormErrors) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field as keyof CustomPromptFormErrors];
      return next;
    });
  };

  const validate = () => {
    const { success, errors } = validateFormPrompt(formPrompt);
    setFormErrors(errors);
    return success;
  };

  return {
    editingId,
    formPrompt,
    formErrors,
    openAdd,
    openEdit,
    reset,
    handleFieldChange,
    validate,
  };
}
