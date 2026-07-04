import { useState } from "react";
import MainContainer from "../../shared/components/MainContainer";
import ConfirmModal from "../../shared/components/ConfirmModal";
import { Button } from "../../shared/components/controls/Button";
import { useCustomPrompts } from "./hooks/useCustomPrompts";
import { usePromptForm } from "./hooks/usePromptForm";
import PromptList from "./components/PromptList";
import PromptFormModal from "./components/PromptFormModal";
import "./Prompt.css";

export default function Prompt() {
  const { prompts, deletePrompt, updatePrompt, addPrompt } = useCustomPrompts();
  const form = usePromptForm();
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
      const updated = { ...form.formPrompt, Id: form.editingId };
      await updatePrompt(updated);
    } else {
      const newPrompt = {
        ...form.formPrompt,
        Id: crypto.randomUUID(),
      };
      await addPrompt(newPrompt);
    }
    closeModal();
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      await deletePrompt(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <>
      <MainContainer>
        <PromptList
          prompts={prompts}
          onEdit={(prompt) => {
            form.openEdit(prompt);
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
            className="form-add-new-prompt"
            label={"Add New Prompt"}
            onClick={openAddModal}
          />
        </div>
      </MainContainer>

      <PromptFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isEditing={!!form.editingId}
        formPrompt={form.formPrompt}
        formErrors={form.formErrors}
        onFieldChange={form.handleFieldChange}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this prompt?"
      />
    </>
  );
}
