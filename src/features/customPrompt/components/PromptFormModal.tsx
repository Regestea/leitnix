import { Button } from "../../../shared/components/controls/Button";
import { Input } from "../../../shared/components/controls/Input";
import { Textarea } from "../../../shared/components/controls/Textarea";
import Modal from "../../../shared/components/Modal";

interface PromptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  formPrompt: {
    Name: string | null;
    Prompt: string | null;
  };
  formErrors: Record<string, string | undefined>;
  onFieldChange: (
    field: "Name" | "Prompt",
    value: string,
  ) => void;
  onSave: () => void;
}

export default function PromptFormModal({
  isOpen,
  onClose,
  isEditing,
  formPrompt,
  formErrors,
  onFieldChange,
  onSave,
}: PromptFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h1>{isEditing ? "Edit Prompt" : "Add New Prompt"}</h1>
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
              label="Name"
              defaultValue={formPrompt.Name ?? ""}
              onChange={(e) => onFieldChange("Name", e)}
            />
            {formErrors.Name && (
              <p className="field-error">{formErrors.Name}</p>
            )}
          </div>

          <div>
            <Textarea
              label="Prompt"
              style={{ width: "100%" }}
              defaultValue={formPrompt.Prompt ?? ""}
              onChange={(e) => onFieldChange("Prompt", e)}
              rows={15}
            />
            {formErrors.Prompt && (
              <p className="field-error">{formErrors.Prompt}</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
        <Button className="secondary" label="Cancel" onClick={onClose} />
        <Button
          label={isEditing ? "Save Changes" : "Save"}
          onClick={onSave}
        />
      </div>
    </Modal>
  );
}
