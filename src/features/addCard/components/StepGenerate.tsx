import { useEffect, useState } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "../../../shared/components/controls/Select";
import { Textarea } from "../../../shared/components/controls/Textarea";
import ImageUpload from "../../../shared/components/controls/ImageUpload";
import ThinkingSphere from "../../../shared/components/thinkingSphere/ThinkingSphere";
import { AiModelRepository } from "../../../repositories/AiModelRepository";
import { CustomPromptRepository } from "../../../repositories/CustomPromptRepository";
import { CategoryTagRepository } from "../../../repositories/CategoryTagRepository";
import CategoryTagManagerModal from "../categoryTagManager/components/CategoryTagManagerModal";
import { NONE_PROMPT_VALUE } from "../../../statics/prompts";
import { TOPIC_OPTIONS } from "../../../statics/topicPrompts";
import type {
  AddCardFormState,
  AddCardFormErrors,
  SelectOption,
} from "../types";

interface StepGenerateProps {
  formState: AddCardFormState;
  formErrors: AddCardFormErrors;
  images: string[];
  isGenerating: boolean;
  error: string | null;
  onFieldChange: (field: keyof AddCardFormState, value: string) => void;
  onImagesChange: (images: string[]) => void;
}

const PLACEHOLDER_TAG: SelectOption = {
  value: "",
  label: "Select category tag...",
};
const PLACEHOLDER_MODEL: SelectOption = {
  value: "",
  label: "Select AI model...",
};
const NONE_PROMPT: SelectOption = { value: NONE_PROMPT_VALUE, label: "None" };

type Optionable = {
  Id: string;
  Name?: string | null;
  DisplayName?: string | null;
  ModelName?: string | null;
};

function toOptions(items: Optionable[]): SelectOption[] {
  return items.map((item) => ({
    value: item.Id,
    label: item.DisplayName ?? item.Name ?? item.ModelName ?? "Unnamed",
  }));
}

export default function StepGenerate({
  formState,
  formErrors,
  images,
  isGenerating,
  error,
  onFieldChange,
  onImagesChange,
}: StepGenerateProps) {
  const [categoryTags, setCategoryTags] = useState<SelectOption[]>([
    PLACEHOLDER_TAG,
  ]);
  const [aiModels, setAiModels] = useState<SelectOption[]>([PLACEHOLDER_MODEL]);
  const [customPrompts, setCustomPrompts] = useState<SelectOption[]>([
    NONE_PROMPT,
  ]);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const loadCategoryTags = async () => {
    const cats = await new CategoryTagRepository().getAll();
    setCategoryTags([PLACEHOLDER_TAG, ...toOptions(cats)]);
  };

  useEffect(() => {
    const loadOptions = async () => {
      const [cats, models, prompts] = await Promise.all([
        new CategoryTagRepository().getAll(),
        new AiModelRepository().getAll(),
        new CustomPromptRepository().getAll(),
      ]);
      setCategoryTags([PLACEHOLDER_TAG, ...toOptions(cats)]);
      setAiModels([PLACEHOLDER_MODEL, ...toOptions(models)]);
      setCustomPrompts([NONE_PROMPT, ...toOptions(prompts)]);
    };
    loadOptions();
  }, []);

  if (isGenerating) {
    return (
      <div className="step-loading">
        <ThinkingSphere />
        <p className="loading-text">Generating your card...</p>
      </div>
    );
  }

  return (
    <div className="step-generate">
      <div className="step-form">
        <div>
          <Select
            label="Topic"
            value={formState.topicType}
            items={TOPIC_OPTIONS}
            onChange={(value) => onFieldChange("topicType", value)}
          />
          {formErrors.topicType && (
            <p className="field-error">{formErrors.topicType}</p>
          )}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <Select
                label="Category Tag"
                value={formState.categoryTagId}
                items={categoryTags}
                onChange={(value) => onFieldChange("categoryTagId", value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsTagManagerOpen(true)}
              aria-label="Manage category tags"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          {formErrors.categoryTagId && (
            <p className="field-error">{formErrors.categoryTagId}</p>
          )}
        </div>

        <div>
          <Select
            label="AI Model"
            value={formState.aiModelId}
            items={aiModels}
            onChange={(value) => onFieldChange("aiModelId", value)}
          />
          {formErrors.aiModelId && (
            <p className="field-error">{formErrors.aiModelId}</p>
          )}
        </div>

        <div>
          <Select
            label="Custom Prompt"
            value={formState.customPromptId || NONE_PROMPT_VALUE}
            items={customPrompts}
            onChange={(value) => onFieldChange("customPromptId", value)}
          />
        </div>

        <div>
          <Textarea
            label="Topic"
            placeholder="Explain the topic you want to learn..."
            defaultValue={formState.topicText}
            rows={6}
            style={{ width: "100%" }}
            onChange={(value) => onFieldChange("topicText", value)}
          />
          {formErrors.topicText && (
            <p className="field-error">{formErrors.topicText}</p>
          )}
        </div>

        <ImageUpload images={images} onChange={onImagesChange} />

        {error && <p className="field-error">{error}</p>}
      </div>

      <CategoryTagManagerModal
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        onTagsChange={loadCategoryTags}
      />
    </div>
  );
}
