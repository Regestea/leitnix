import { Textarea } from "../../../shared/components/controls/Textarea";
import { Button } from "../../../shared/components/controls/Button";
import ThinkingSphere from "../../../shared/components/thinkingSphere/ThinkingSphere";
import { useSelectOptions } from "../hooks/useSelectOptions";
import { NONE_PROMPT_VALUE } from "../types";
import type { AddCardFormState, AddCardFormErrors } from "../types";
import { SelectField } from "./SelectField";

interface StepGenerateProps {
  formState: AddCardFormState;
  formErrors: AddCardFormErrors;
  setCategoryTagId: (id: string) => void;
  setAiModelId: (id: string) => void;
  setCustomPromptId: (id: string) => void;
  setTopicText: (text: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

export default function StepGenerate({
  formState,
  formErrors,
  setCategoryTagId,
  setAiModelId,
  setCustomPromptId,
  setTopicText,
  isGenerating,
  onGenerate,
}: StepGenerateProps) {
  const { categoryTags, aiModels, customPrompts } = useSelectOptions();

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
        <SelectField
          label="Category Tag"
          value={formState.categoryTagId}
          items={categoryTags}
          onChange={setCategoryTagId}
          error={formErrors.categoryTagId}
        />

        <SelectField
          label="AI Model"
          value={formState.aiModelId}
          items={aiModels}
          onChange={setAiModelId}
          error={formErrors.aiModelId}
        />

        <SelectField
          label="Custom Prompt"
          value={formState.customPromptId || NONE_PROMPT_VALUE}
          items={customPrompts}
          onChange={setCustomPromptId}
        />

        <div>
          <Textarea
            label="Topic"
            placeholder="Explain the topic you want to learn..."
            defaultValue={formState.topicText}
            rows={6}
            onChange={setTopicText}
          />
          {formErrors.topicText && (
            <p className="field-error">{formErrors.topicText}</p>
          )}
        </div>

        <div className="step-actions">
          <Button label="Generate" onClick={onGenerate} />
        </div>
      </div>
    </div>
  );
}
