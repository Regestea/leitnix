import { useState } from "react";
import { EMPTY_BOX, validateFormBox } from "../types";
import type { BoxFormErrors } from "../types";
import type { Box } from "../../../shared/types/entities";

export function useBoxForm() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formBox, setFormBox] = useState<Box>(EMPTY_BOX);
  const [formErrors, setFormErrors] = useState<BoxFormErrors>({});

  const openAdd = () => {
    setEditingId(null);
    setFormBox(EMPTY_BOX);
    setFormErrors({});
  };

  const openEdit = (box: Box) => {
    setEditingId(box.Id);
    setFormBox(box);
    setFormErrors({});
  };

  const reset = () => {
    setEditingId(null);
    setFormBox(EMPTY_BOX);
    setFormErrors({});
  };

  const handleNameChange = (value: string) => {
    setFormBox((prev: Box) => ({
      ...prev,
      Name: value === "" ? null : value,
    }));
    setFormErrors((prev: BoxFormErrors) => {
      if (!("Name" in prev)) return prev;
      const next = { ...prev };
      delete next.Name;
      return next;
    });
  };

  const handleRepeatPeriodChange = (value: number) => {
    setFormBox((prev: Box) => ({
      ...prev,
      RepeatIntervalSeconds: value,
    }));
    setFormErrors((prev: BoxFormErrors) => {
      if (!("RepeatIntervalSeconds" in prev)) return prev;
      const next = { ...prev };
      delete next.RepeatIntervalSeconds;
      return next;
    });
  };

  const validate = () => {
    const { success, errors } = validateFormBox(formBox);
    setFormErrors(errors);
    return success;
  };

  return {
    editingId,
    formBox,
    formErrors,
    openAdd,
    openEdit,
    reset,
    handleNameChange,
    handleRepeatPeriodChange,
    validate,
  };
}
