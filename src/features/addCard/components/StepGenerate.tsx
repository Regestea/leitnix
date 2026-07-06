import { useEffect, useState } from "react";
import { Select } from "../../../shared/components/controls/Select";
import { Textarea } from "../../../shared/components/controls/Textarea";
import { Button } from "../../../shared/components/controls/Button";
import ImageUpload from "../../../shared/components/controls/ImageUpload";
import ThinkingSphere from "../../../shared/components/thinkingSphere/ThinkingSphere";
import { AiModelRepository } from "../../aiModels/repository/AiModelRepository";
import { CustomPromptRepository } from "../../customPrompt/repository/CustomPromptRepository";
import { CategoryTagRepository } from "../repository/CategoryTagRepository";
import { CardService } from "../../../services/CardService";
import { NONE_PROMPT_VALUE } from "../../../statics/prompts";
import { EMPTY_FORM_STATE, validateAddCardForm } from "../types";
import type {
  AddCardFormState,
  AddCardFormErrors,
  GeneratedCardData,
  SelectOption,
} from "../types";

interface StepGenerateProps {
  onGenerated: (card: GeneratedCardData, form: AddCardFormState) => void;
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

export default function StepGenerate({ onGenerated }: StepGenerateProps) {
  const [formState, setFormState] =
    useState<AddCardFormState>(EMPTY_FORM_STATE);
  const [formErrors, setFormErrors] = useState<AddCardFormErrors>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const [categoryTags, setCategoryTags] = useState<SelectOption[]>([
    PLACEHOLDER_TAG,
  ]);
  const [aiModels, setAiModels] = useState<SelectOption[]>([PLACEHOLDER_MODEL]);
  const [customPrompts, setCustomPrompts] = useState<SelectOption[]>([
    NONE_PROMPT,
  ]);

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

  const updateField = (field: keyof AddCardFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleGenerate = async () => {
    const { success, errors } = validateAddCardForm(formState);
    if (!success) {
      setFormErrors(errors);
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const cardService = new CardService();
      const card = await cardService.generateCard({
        aiModelId: formState.aiModelId,
        customPromptId: formState.customPromptId,
        topicText: formState.topicText,
        images: images.length > 0 ? images : undefined,
      });
      onGenerated(card, formState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate card");
    } finally {
      setIsGenerating(false);
    }
  };

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
            label="Category Tag"
            value={formState.categoryTagId}
            items={categoryTags}
            onChange={(value) => updateField("categoryTagId", value)}
          />
          {formErrors.categoryTagId && (
            <p className="field-error">{formErrors.categoryTagId}</p>
          )}
        </div>

        <div>
          <Select
            label="AI Model"
            value={formState.aiModelId}
            items={aiModels}
            onChange={(value) => updateField("aiModelId", value)}
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
            onChange={(value) => updateField("customPromptId", value)}
          />
        </div>

        <div>
          <Textarea
            label="Topic"
            placeholder="Explain the topic you want to learn..."
            defaultValue={formState.topicText}
            rows={6}
            onChange={(value) => updateField("topicText", value)}
          />
          {formErrors.topicText && (
            <p className="field-error">{formErrors.topicText}</p>
          )}
        </div>

        <ImageUpload images={images} onChange={setImages} />

        {error && <p className="field-error">{error}</p>}

        <div className="step-actions">
          <Button label="Generate" onClick={handleGenerate} />
        </div>
      </div>
    </div>
  );
}
