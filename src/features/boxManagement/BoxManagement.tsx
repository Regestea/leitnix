import { useState } from "react";
import MainContainer from "../../shared/components/MainContainer";
import ConfirmModal from "../../shared/components/ConfirmModal";
import { Button } from "../../shared/components/controls/Button";
import { useBoxes } from "./hooks/useBoxes";
import { useBoxForm } from "./hooks/useBoxForm";
import BoxList from "./components/BoxList";
import BoxFormModal from "./components/BoxFormModal";
import styles from "./BoxManagement.module.css";

export default function BoxManagement() {
  const { boxes, cardCounts, deleteBox, updateBox, addBox } = useBoxes();
  const form = useBoxForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const openAddModal = () => {
    form.openAdd();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    form.reset();
    setIsModalOpen(false);
  };

  const handleSave = async () => {
    if (!form.validate()) return;

    if (form.editingId) {
      const updated = {
        ...form.formBox,
        Id: form.editingId,
      };
      await updateBox(updated);
    } else {
      const newBox = {
        ...form.formBox,
        Id: crypto.randomUUID(),
      };
      await addBox(newBox);
    }
    closeModal();
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      await deleteBox(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <>
      <MainContainer>
        <h3 className={styles.pageHeading}>Manage Boxes</h3>
        <BoxList
          boxes={boxes}
          cardCounts={cardCounts}
          onEdit={(box) => {
            form.openEdit(box);
            setIsModalOpen(true);
          }}
          onDelete={(id) => setDeleteTargetId(id)}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Button
            className={styles.formAddNewBox}
            label={"Add New Box"}
            onClick={openAddModal}
          />
        </div>
      </MainContainer>

      <BoxFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isEditing={!!form.editingId}
        formBox={form.formBox}
        formErrors={form.formErrors}
        onNameChange={form.handleNameChange}
        onRepeatPeriodChange={form.handleRepeatPeriodChange}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this box? Cards in this box will be moved to the previous box."
      />
    </>
  );
}
