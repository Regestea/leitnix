import { Button } from "../../../shared/components/controls/Button";
import { Input } from "../../../shared/components/controls/Input";
import { Select } from "../../../shared/components/controls/Select";
import Modal from "../../../shared/components/modal/Modal";
import { REPEAT_PERIOD_OPTIONS } from "../types";

interface BoxFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  formBox: {
    Name: string | null;
    RepeatIntervalSeconds: number | null;
  };
  formErrors: Record<string, string | undefined>;
  onNameChange: (value: string) => void;
  onRepeatPeriodChange: (value: number) => void;
  onSave: () => void;
}

export default function BoxFormModal({
  isOpen,
  onClose,
  isEditing,
  formBox,
  formErrors,
  onNameChange,
  onRepeatPeriodChange,
  onSave,
}: BoxFormModalProps) {
  const periodValue =
    formBox.RepeatIntervalSeconds != null
      ? String(formBox.RepeatIntervalSeconds)
      : "";

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h1>{isEditing ? "Edit Box" : "Add New Box"}</h1>
      <div
        style={{
          marginBottom: "1rem",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div>
          <Input
            label="Name"
            defaultValue={formBox.Name ?? ""}
            onChange={onNameChange}
          />
          {formErrors.Name && (
            <p className="field-error">{formErrors.Name}</p>
          )}
        </div>

        <div>
          <Select
            label="Repeat Period"
            value={periodValue}
            items={REPEAT_PERIOD_OPTIONS.map((opt) => ({
              label: opt.label,
              value: String(opt.value),
            }))}
            onChange={(val: string) => onRepeatPeriodChange(Number(val))}
          />
          {formErrors.RepeatIntervalSeconds && (
            <p className="field-error">{formErrors.RepeatIntervalSeconds}</p>
          )}
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
