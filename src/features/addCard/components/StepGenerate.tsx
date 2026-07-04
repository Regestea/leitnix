import { useEffect, useState } from "react";
import { Select } from "../../../shared/components/controls/Select";
import { Textarea } from "../../../shared/components/controls/Textarea";
import { Button } from "../../../shared/components/controls/Button";
import ThinkingSphere from "../../../shared/components/thinkingSphere/ThinkingSphere";
import { AiModelRepository } from "../../aiModels/repository/AiModelRepository";
import { CustomPromptRepository } from "../../customPrompt/repository/CustomPromptRepository";
import { CategoryTagRepository } from "../repository/CategoryTagRepository";
import { NONE_PROMPT_VALUE } from "../types";
import type { AddCardFormState, AddCardFormErrors } from "../types";

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
  const [categoryTags, setCategoryTags] = useState<
    { value: string; label: string }[]
  >([]);
  const [aiModels, setAiModels] = useState<
    { value: string; label: string }[]
  >([]);
  const [customPrompts, setCustomPrompts] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    const loadData = async () => {
      const catRepo = new CategoryTagRepository();
      const cats = await catRepo.getAll();
      setCategoryTags([
        { value: "", label: "Select category tag..." },
        ...cats.map((c) => ({ value: c.Id, label: c.Name ?? "Unnamed" })),
      ]);

      const modelRepo = new AiModelRepository();
      const models = await modelRepo.getAll();
      setAiModels([
        { value: "", label: "Select AI model..." },
        ...models.map((m) => ({
          value: m.Id,
          label: m.DisplayName ?? m.ModelName ?? "Unnamed",
        })),
      ]);

      const promptRepo = new CustomPromptRepository();
      const prompts = await promptRepo.getAll();
      const noneOption = { value: NONE_PROMPT_VALUE, label: "None" };
      setCustomPrompts([
        noneOption,
        ...prompts.map((p) => ({ value: p.Id, label: p.Name ?? "Unnamed" })),
      ]);
    };

    loadData();
  }, []);

  return (
    <div className="step-generate">
      {isGenerating ? (
        <div className="step-loading">
          <ThinkingSphere />
          <p className="loading-text">Generating your card...</p>
        </div>
      ) : (
        <div
          style={{
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div>
            <Select
              label="Category Tag"
              value={formState.categoryTagId}
              items={categoryTags}
              onChange={setCategoryTagId}
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
              onChange={setAiModelId}
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
              onChange={setCustomPromptId}
            />
          </div>

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
      )}
    </div>
  );
}
