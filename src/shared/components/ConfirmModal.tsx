import { Button } from "./controls/Button";
import Modal from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  confirmLabel?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  message,
  confirmLabel = "Delete",
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <p style={{ textAlign: "center", margin: "1rem 0" }}>{message}</p>
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
        <Button className="secondary" label="Cancel" onClick={onClose} />
        <Button label={confirmLabel} onClick={onConfirm} />
      </div>
    </Modal>
  );
}
