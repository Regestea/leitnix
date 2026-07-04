import { useState } from "react";
import { EMPTY_FORM_STATE, validateAddCardForm } from "../types";
import type { AddCardFormState, AddCardFormErrors } from "../types";

export function useAddCardForm() {
  const [formState, setFormState] = useState<AddCardFormState>(EMPTY_FORM_STATE);
  const [formErrors, setFormErrors] = useState<AddCardFormErrors>({});

  const setCategoryTagId = (id: string) => {
    setFormState((prev) => ({ ...prev, categoryTagId: id }));
    setFormErrors((prev) => {
      if (!("categoryTagId" in prev)) return prev;
      const next = { ...prev };
      delete next.categoryTagId;
      return next;
    });
  };

  const setAiModelId = (id: string) => {
    setFormState((prev) => ({ ...prev, aiModelId: id }));
    setFormErrors((prev) => {
      if (!("aiModelId" in prev)) return prev;
      const next = { ...prev };
      delete next.aiModelId;
      return next;
    });
  };

  const setCustomPromptId = (id: string) => {
    setFormState((prev) => ({ ...prev, customPromptId: id }));
  };

  const setTopicText = (text: string) => {
    setFormState((prev) => ({ ...prev, topicText: text }));
    setFormErrors((prev) => {
      if (!("topicText" in prev)) return prev;
      const next = { ...prev };
      delete next.topicText;
      return next;
    });
  };

  const reset = () => {
    setFormState(EMPTY_FORM_STATE);
    setFormErrors({});
  };

  const validate = (): boolean => {
    const { success, errors } = validateAddCardForm(formState);
    setFormErrors(errors);
    return success;
  };

  return {
    formState,
    formErrors,
    setCategoryTagId,
    setAiModelId,
    setCustomPromptId,
    setTopicText,
    reset,
    validate,
  };
}
