import { useState } from "react";
import { EMPTY_TAG, validateCategoryTagForm } from "../types";
import type { CategoryTagFormErrors } from "../types";
import type { CategoryTag } from "../../../../db/entities";

export function useCategoryTagForm() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTag, setFormTag] = useState<CategoryTag>(EMPTY_TAG);
  const [formErrors, setFormErrors] = useState<CategoryTagFormErrors>({});

  const openAdd = () => {
    setEditingId(null);
    setFormTag(EMPTY_TAG);
    setFormErrors({});
  };

  const openEdit = (tag: CategoryTag) => {
    setEditingId(tag.Id);
    setFormTag(tag);
    setFormErrors({});
  };

  const reset = () => {
    setEditingId(null);
    setFormTag(EMPTY_TAG);
    setFormErrors({});
  };

  const handleFieldChange = (value: string) => {
    setFormTag((prev) => ({
      ...prev,
      Name: value,
    }));
    setFormErrors((prev) => {
      if (!("Name" in prev)) return prev;
      const next = { ...prev };
      delete next["Name"];
      return next;
    });
  };

  const validate = () => {
    const { success, errors } = validateCategoryTagForm(formTag);
    setFormErrors(errors);
    return success;
  };

  return {
    editingId,
    formTag,
    formErrors,
    openAdd,
    openEdit,
    reset,
    handleFieldChange,
    validate,
  };
}
