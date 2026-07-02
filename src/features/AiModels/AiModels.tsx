import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MainContainer from "../../shared/components/MainContainer";
import { Button } from "../../shared/components/controls/Button";
import { Input } from "../../shared/components/controls/Input";
import Modal from "../../shared/components/Modal";
import type { AiModel } from "../../db/schema";
import { useState } from "react";
import { z } from "zod";
import "./AiModels.css";

const EMPTY_MODEL: AiModel = {
  Id: "",
  DisplayName: null,
  URL: null,
  ModelName: null,
  APIKey: null,
};

const aiModelFormSchema = z.object({
  DisplayName: z
    .string()
    .trim()
    .min(1, "Display name is required."),
  ModelName: z
    .string()
    .trim()
    .min(1, "Model name is required."),
  URL: z
    .string()
    .trim()
    .url("Enter a valid URL, e.g. https://api.example.com/v1")
    .min(1, "URL is required."),
  APIKey: z
    .string()
    .trim()
    .min(1, "API key is required."),
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
    URL: model.URL ?? "",
    APIKey: model.APIKey ?? "",
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
  const [models, setModels] = useState<AiModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formModel, setFormModel] = useState<AiModel>(EMPTY_MODEL);

  const [testApiSuccess, setTestApiSuccess] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testApiError, setTestApiError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<AiModelFormErrors>({});

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

  const handleDelete = (id: string) => {
    setModels((prev) => prev.filter((m) => m.Id !== id));
  };

  const handleFieldChange = (field: keyof AiModel, value: string) => {
    setFormModel((prev: AiModel) => ({ ...prev, [field]: value === "" ? null : value }));
    setTestApiSuccess(false);
    setTestApiError(null);
    setFormErrors((prev:AiModelFormErrors) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field as keyof AiModelFormErrors];
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
      const response = await fetch(formModel.URL as string, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${formModel.APIKey}`,
        },
      });

      if (response.ok) {
        setTestApiSuccess(true);
      } else {
        setTestApiSuccess(false);
        setTestApiError(`Test failed: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      setTestApiSuccess(false);
      setTestApiError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSave = () => {
    const { success, errors } = validateFormModel(formModel);
    setFormErrors(errors);
    if (!success) {
      setTestApiSuccess(false);
      return;
    }

    if (editingId) {
      setModels((prev) =>
        prev.map((m) => (m.Id === editingId ? { ...formModel, Id: editingId } : m))
      );
    } else {
      const newModel: AiModel = {
        ...formModel,
        Id: crypto.randomUUID(),
      };
      setModels((prev) => [...prev, newModel]);
    }
    closeModal();
  };

  return (
    <>
      <MainContainer>
        {models.length === 0 ? (
          <p className="no-models-text">No AI models added yet.</p>
        ) : (
          models.map((model) => (
            <div className="ai-model-form" key={model.Id}>
              <div className="model-item">
                <h4>{model.DisplayName ?? model.ModelName ?? "Untitled Model"}</h4>
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
            </div>
          ))
        )}

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

            <div>
              <Input
                label="URL"
                defaultValue={formModel.URL ?? ""}
                onChange={(e) => handleFieldChange("URL", e)}
              />
              {formErrors.URL && <p className="field-error">{formErrors.URL}</p>}
            </div>

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

        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          <Button className="secondary" label="Cancel" onClick={closeModal} />

          {testApiSuccess ? (
            <Button label={editingId ? "Save Changes" : "Save"} onClick={handleSave} />
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