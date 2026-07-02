import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MainContainer from "../../shared/components/MainContainer";
import { Button } from "../../shared/components/controls/Button";
import { Input } from "../../shared/components/controls/Input";
import { Select } from "../../shared/components/controls/Select";
import Modal from "../../shared/components/Modal";
import type { AiModel } from "../../db/schema";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import "./AiModels.css";
import { testApi } from "../../services/aiService";
import { AiModelRepository } from "../../repositories/AiModelRepository";
import { resolveProviderBaseUrl } from "../../staticConfigs/ProviderConfig";

const EMPTY_MODEL: AiModel = {
  Id: "",
  DisplayName: null,
  URL: null,
  ModelName: null,
  APIKey: null,
  Provider: "GoogleGemini",
};

const PROVIDER_OPTIONS: { label: string; value: AiModel["Provider"] }[] = [
  { label: "Google Gemini", value: "GoogleGemini" },
  { label: "OpenRouter", value: "OpenRouter" },
  { label: "AvalAI", value: "AvalAi" },
  { label: "OpenAI", value: "OpenAi" },
  { label: "OpenAI Compatible", value: "OpenAiCompatible" },
];

const aiModelFormSchema = z
  .object({
    DisplayName: z.string().trim().min(1, "Display name is required."),
    ModelName: z.string().trim().min(1, "Model name is required."),
    APIKey: z.string().trim().min(1, "API key is required."),
    Provider: z.enum([
      "GoogleGemini",
      "OpenRouter",
      "AvalAi",
      "OpenAi",
      "OpenAiCompatible",
    ]),
    URL: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.Provider !== "OpenAiCompatible") return;

    if (!data.URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["URL"],
        message: "URL is required.",
      });
      return;
    }

    const urlCheck = z
      .string()
      .url(
        "Enter a valid URL, e.g. https://api.example.com/v1 , your url should end with things like /v1",
      )
      .safeParse(data.URL);

    if (!urlCheck.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["URL"],
        message: urlCheck.error.issues[0]?.message ?? "Enter a valid URL.",
      });
    }
  });

type AiModelFormErrors = Partial<
  Record<keyof z.infer<typeof aiModelFormSchema>, string>
>;

function validateFormModel(model: AiModel): {
  success: boolean;
  errors: AiModelFormErrors;
} {
  const result = aiModelFormSchema.safeParse({
    DisplayName: model.DisplayName ?? "",
    ModelName: model.ModelName ?? "",
    APIKey: model.APIKey ?? "",
    Provider: model.Provider,
    URL: model.URL ?? "",
  });

  if (result.success) {
    return { success: true, errors: {} };
  }

  const errors: AiModelFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof AiModelFormErrors;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}

export default function AiModels() {
  const repository = useMemo(() => new AiModelRepository(), []);

  const [models, setModels] = useState<AiModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formModel, setFormModel] = useState<AiModel>(EMPTY_MODEL);

  const [testApiSuccess, setTestApiSuccess] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testApiError, setTestApiError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<AiModelFormErrors>({});

  useEffect(() => {
    let cancelled = false;
    repository.getAll().then((data) => {
      if (!cancelled) setModels(data);
    });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const openAddModal = () => {
    setEditingId(null);
    setFormModel(EMPTY_MODEL);
    setTestApiSuccess(false);
    setTestApiError(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (model: AiModel) => {
    setEditingId(model.Id);
    setFormModel(model);
    setTestApiSuccess(true);
    setTestApiError(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormModel(EMPTY_MODEL);
    setTestApiSuccess(false);
    setTestApiError(null);
    setFormErrors({});
  };

  const handleDelete = async (id: string) => {
    await repository.delete(id);
    setModels((prev) => prev.filter((m) => m.Id !== id));
  };

  const handleFieldChange = (
    field: Exclude<keyof AiModel, "Provider">,
    value: string,
  ) => {
    setFormModel((prev: AiModel) => ({
      ...prev,
      [field]: value === "" ? null : value,
    }));
    setTestApiSuccess(false);
    setTestApiError(null);
    setFormErrors((prev: AiModelFormErrors) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field as keyof AiModelFormErrors];
      return next;
    });
  };

  const handleProviderChange = (provider: AiModel["Provider"]) => {
    setFormModel((prev) => ({
      ...prev,
      Provider: provider,
      URL: provider === "OpenAiCompatible" ? prev.URL : null,
    }));
    setTestApiSuccess(false);
    setTestApiError(null);
    setFormErrors((prev) => {
      if (!("URL" in prev)) return prev;
      const next = { ...prev };
      delete next.URL;
      return next;
    });
  };

  const handleTestApiKey = async () => {
    const { success, errors } = validateFormModel(formModel);
    setFormErrors(errors);
    if (!success) {
      setTestApiError(null);
      return;
    }

    setIsTestingApi(true);
    setTestApiError(null);

    try {
      const url = resolveProviderBaseUrl(formModel);
      const result = await testApi(
        url,
        formModel.APIKey as string,
        formModel.ModelName as string,
      );
      setTestApiSuccess(result);
      if (!result) {
        setTestApiError("Test failed");
      }
    } catch (err) {
      setTestApiSuccess(false);
      setTestApiError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSave = async () => {
    const { success, errors } = validateFormModel(formModel);
    setFormErrors(errors);
    if (!success) {
      setTestApiSuccess(false);
      return;
    }

    if (editingId) {
      const updated: AiModel = { ...formModel, Id: editingId };
      await repository.update(updated);
      setModels((prev) => prev.map((m) => (m.Id === editingId ? updated : m)));
    } else {
      const newModel: AiModel = {
        ...formModel,
        Id: crypto.randomUUID(), // UUID string, used as the primary key
      };
      await repository.create(newModel);
      setModels((prev) => [...prev, newModel]);
    }
    closeModal();
  };

  return (
    <>
      <MainContainer>
        <div className="ai-model-form">
          {models.length === 0 ? (
            <p className="no-models-text">No AI models added yet.</p>
          ) : (
            models.map((model) => (
              <div className="model-item" key={model.Id}>
                <h4>
                  {model.DisplayName ?? model.ModelName ?? "Untitled Model"}
                </h4>
                <div className="model-control-menu">
                  <span
                    className="model-control-menu"
                    onClick={() => openEditModal(model)}
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </span>
                  <span
                    className="model-control-menu"
                    onClick={() => handleDelete(model.Id)}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Button
            className="form-add-new-model"
            label={"Add New Model"}
            onClick={openAddModal}
          />
        </div>
      </MainContainer>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <h1>{editingId ? "Edit Model" : "Add New Model"}</h1>
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div>
              <div>
                <Select
                  label="Provider"
                  value={formModel.Provider}
                  items={PROVIDER_OPTIONS}
                  onChange={handleProviderChange}
                />
              </div>
              <Input
                label="Display Name"
                defaultValue={formModel.DisplayName ?? ""}
                onChange={(e) => handleFieldChange("DisplayName", e)}
              />
              {formErrors.DisplayName && (
                <p className="field-error">{formErrors.DisplayName}</p>
              )}
            </div>

            <div>
              <Input
                label="Model Name"
                defaultValue={formModel.ModelName ?? ""}
                onChange={(e) => handleFieldChange("ModelName", e)}
              />
              {formErrors.ModelName && (
                <p className="field-error">{formErrors.ModelName}</p>
              )}
            </div>

            {formModel.Provider === "OpenAiCompatible" && (
              <div>
                <Input
                  label="URL"
                  defaultValue={formModel.URL ?? ""}
                  onChange={(e) => handleFieldChange("URL", e)}
                />
                {formErrors.URL && (
                  <p className="field-error">{formErrors.URL}</p>
                )}
              </div>
            )}

            <div>
              <Input
                label="API Key"
                type="password"
                defaultValue={formModel.APIKey ?? ""}
                onChange={(e) => handleFieldChange("APIKey", e)}
              />
              {formErrors.APIKey && (
                <p className="field-error">{formErrors.APIKey}</p>
              )}
            </div>

            {testApiError && (
              <p style={{ color: "red", margin: 0 }}>{testApiError}</p>
            )}
          </div>
        </div>

        <div
          style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}
        >
          <Button className="secondary" label="Cancel" onClick={closeModal} />

          {testApiSuccess ? (
            <Button
              label={editingId ? "Save Changes" : "Save"}
              onClick={handleSave}
            />
          ) : (
            <Button
              label={isTestingApi ? "Testing..." : "Test API Key"}
              onClick={handleTestApiKey}
              disabled={isTestingApi}
            />
          )}
        </div>

        <div style={{ marginTop: "1rem", textAlign: "center", color: "green" }}>
          {testApiSuccess && "API key is valid!"}
        </div>
      </Modal>
    </>
  );
}
