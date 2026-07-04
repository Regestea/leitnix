import { useEffect, useState } from "react";
import { AiModelRepository } from "../../aiModels/repository/AiModelRepository";
import { CustomPromptRepository } from "../../customPrompt/repository/CustomPromptRepository";
import { CategoryTagRepository } from "../repository/CategoryTagRepository";
import { NONE_PROMPT_VALUE } from "../types";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectOptions {
  categoryTags: SelectOption[];
  aiModels: SelectOption[];
  customPrompts: SelectOption[];
}

const PLACEHOLDER_TAG = { value: "", label: "Select category tag..." };
const PLACEHOLDER_MODEL = { value: "", label: "Select AI model..." };
const NONE_PROMPT = { value: NONE_PROMPT_VALUE, label: "None" };

function toOptions(items: { Id: string; Name?: string | null; DisplayName?: string | null; ModelName?: string | null }[]): SelectOption[] {
  return items.map((item) => ({
    value: item.Id,
    label: item.DisplayName ?? item.Name ?? item.ModelName ?? "Unnamed",
  }));
}

export function useSelectOptions(): SelectOptions {
  const [options, setOptions] = useState<SelectOptions>({
    categoryTags: [PLACEHOLDER_TAG],
    aiModels: [PLACEHOLDER_MODEL],
    customPrompts: [NONE_PROMPT],
  });

  useEffect(() => {
    const loadData = async () => {
      const [cats, models, prompts] = await Promise.all([
        new CategoryTagRepository().getAll(),
        new AiModelRepository().getAll(),
        new CustomPromptRepository().getAll(),
      ]);

      setOptions({
        categoryTags: [PLACEHOLDER_TAG, ...toOptions(cats)],
        aiModels: [PLACEHOLDER_MODEL, ...toOptions(models)],
        customPrompts: [NONE_PROMPT, ...toOptions(prompts)],
      });
    };

    loadData();
  }, []);

  return options;
}
