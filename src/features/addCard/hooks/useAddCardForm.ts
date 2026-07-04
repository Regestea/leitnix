import { useState, useCallback } from "react";
import { EMPTY_FORM_STATE, validateAddCardForm } from "../types";
import type { AddCardFormState, AddCardFormErrors } from "../types";

type FormField = keyof AddCardFormState;

const VALIDATABLE_FIELDS: FormField[] = [
  "categoryTagId",
  "aiModelId",
  "topicText",
];

export function useAddCardForm() {
  const [formState, setFormState] = useState<AddCardFormState>(EMPTY_FORM_STATE);
  const [formErrors, setFormErrors] = useState<AddCardFormErrors>({});

  const setField = useCallback(
    (field: FormField, value: string) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => {
        if (!VALIDATABLE_FIELDS.includes(field) || !(field in prev)) return prev;
        const next = { ...prev };
        delete next[field as keyof AddCardFormErrors];
        return next;
      });
    },
    []
  );

  const setCategoryTagId = useCallback(
    (id: string) => setField("categoryTagId", id),
    [setField]
  );
  const setAiModelId = useCallback(
    (id: string) => setField("aiModelId", id),
    [setField]
  );
  const setCustomPromptId = useCallback(
    (id: string) => setField("customPromptId", id),
    [setField]
  );
  const setTopicText = useCallback(
    (text: string) => setField("topicText", text),
    [setField]
  );

  const reset = useCallback(() => {
    setFormState(EMPTY_FORM_STATE);
    setFormErrors({});
  }, []);

  const validate = useCallback((): boolean => {
    const { success, errors } = validateAddCardForm(formState);
    setFormErrors(errors);
    return success;
  }, [formState]);

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
