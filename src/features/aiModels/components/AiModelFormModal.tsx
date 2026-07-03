import { Button } from "../../../shared/components/controls/Button";
import { Input } from "../../../shared/components/controls/Input";
import { Select } from "../../../shared/components/controls/Select";
import Modal from "../../../shared/components/Modal";
import type { AiProvider } from "../../../shared/types/entities";

import { PROVIDER_OPTIONS } from "../types";

interface AiModelFormModalProps {
  isOpen: boolean;
  onClose: () => void;

  isEditing: boolean;
  formModel: {
    Provider: AiProvider;
    DisplayName: string | null;
    ModelName: string | null;
    URL: string | null;
    APIKey: string | null;
  };

  formErrors: Record<string, string | undefined>;
  testApiSuccess: boolean;
  isTestingApi: boolean;
  testApiError: string | null;

  onProviderChange: (provider: AiProvider) => void;
  onFieldChange: (field: "DisplayName" | "ModelName" | "URL" | "APIKey", value: string) => void;
  onTestApiKey: () => void;
  onSave: () => void;
}

export default function AiModelFormModal({
  isOpen,
  onClose,
  isEditing,
  formModel,
  formErrors,
  testApiSuccess,
  isTestingApi,
  testApiError,
  onProviderChange,
  onFieldChange,
  onTestApiKey,
  onSave,
}: AiModelFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h1>{isEditing ? "Edit Model" : "Add New Model"}</h1>
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
                onChange={onProviderChange}
              />
            </div>
            <Input
              label="Display Name"
              defaultValue={formModel.DisplayName ?? ""}
              onChange={(e) => onFieldChange("DisplayName", e)}
            />
            {formErrors.DisplayName && (
              <p className="field-error">{formErrors.DisplayName}</p>
            )}
          </div>

          <div>
            <Input
              label="Model Name"
              defaultValue={formModel.ModelName ?? ""}
              onChange={(e) => onFieldChange("ModelName", e)}
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
                onChange={(e) => onFieldChange("URL", e)}
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
              onChange={(e) => onFieldChange("APIKey", e)}
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
        <Button className="secondary" label="Cancel" onClick={onClose} />

        {testApiSuccess ? (
          <Button
            label={isEditing ? "Save Changes" : "Save"}
            onClick={onSave}
          />
        ) : (
          <Button
            label={isTestingApi ? "Testing..." : "Test API Key"}
            onClick={onTestApiKey}
            disabled={isTestingApi}
          />
        )}
      </div>

      <div style={{ marginTop: "1rem", textAlign: "center", color: "green" }}>
        {testApiSuccess && "API key is valid!"}
      </div>
    </Modal>
  );
}
