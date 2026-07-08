import { Button } from "../../../../shared/components/controls/Button";
import { Input } from "../../../../shared/components/controls/Input";
import Modal from "../../../../shared/components/Modal";

interface CategoryTagFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  tagName: string;
  formErrors: Record<string, string | undefined>;
  onNameChange: (value: string) => void;
  onSave: () => void;
}

export default function CategoryTagFormModal({
  isOpen,
  onClose,
  isEditing,
  tagName,
  formErrors,
  onNameChange,
  onSave,
}: CategoryTagFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h1>{isEditing ? "Edit Tag" : "Add New Tag"}</h1>
      <div>
        <div
        >
          <div>
            <Input
              label="Name"
              defaultValue={tagName}
              onChange={onNameChange}
            />
            {formErrors.Name && (
              <p className="field-error">{formErrors.Name}</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
        <Button className="secondary" label="Cancel" onClick={onClose} />
        <Button label={isEditing ? "Save Changes" : "Save"} onClick={onSave} />
      </div>
    </Modal>
  );
}
