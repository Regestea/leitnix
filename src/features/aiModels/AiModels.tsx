import { useState } from "react";
import MainContainer from "../../shared/components/MainContainer";
import ConfirmModal from "../../shared/components/ConfirmModal";
import { Button } from "../../shared/components/controls/Button";
import { useAiModels } from "./hooks/useAiModels";
import { useAiModelForm } from "./hooks/useAiModelForm";
import ModelList from "./components/ModelList";
import AiModelFormModal from "./components/AiModelFormModal";
import styles from "./AiModels.module.css";

export default function AiModels() {
  const { models, deleteModel, updateModel, addModel } = useAiModels();
  const form = useAiModelForm();
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
      const updated = { ...form.formModel, Id: form.editingId };
      await updateModel(updated);
    } else {
      const newModel = {
        ...form.formModel,
        Id: crypto.randomUUID(),
      };
      await addModel(newModel);
    }
    closeModal();
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      await deleteModel(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <>
      <MainContainer>
        <h3 className={styles.pageHeading}>AI Models</h3>
        <ModelList
          models={models}
          onEdit={(model) => {
            form.openEdit(model);
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
            className={styles.formAddNewModel}
            label={"Add New Model"}
            onClick={openAddModal}
          />
        </div>
      </MainContainer>

      <AiModelFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isEditing={!!form.editingId}
        formModel={form.formModel}
        formErrors={form.formErrors}
        testApiSuccess={form.testApiSuccess}
        isTestingApi={form.isTestingApi}
        testApiError={form.testApiError}
        geminiModels={form.geminiModels}
        isLoadingGeminiModels={form.isLoadingGeminiModels}
        geminiModelsError={form.geminiModelsError}
        onProviderChange={form.handleProviderChange}
        onFieldChange={form.handleFieldChange}
        onTestApiKey={form.testApiKey}
        onSave={handleSave}
        onApiKeyBlur={() => {
          if (form.formModel.Provider === "GoogleGemini" && form.formModel.APIKey) {
            form.fetchGeminiModels(form.formModel.APIKey);
          }
        }}
      />

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this AI model?"
      />
    </>
  );
}
