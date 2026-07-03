import { useState } from "react";
import MainContainer from "../../shared/components/MainContainer";
import { Button } from "../../shared/components/controls/Button";
import { useAiModels } from "./hooks/useAiModels";
import { useAiModelForm } from "./hooks/useAiModelForm";
import ModelList from "./components/ModelList";
import AiModelFormModal from "./components/AiModelFormModal";
import "./AiModels.css";

export default function AiModels() {
  const { models, deleteModel, updateModel, addModel } = useAiModels();
  const form = useAiModelForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <>
      <MainContainer>
        <ModelList
          models={models}
          onEdit={(model) => {
            form.openEdit(model);
            setIsModalOpen(true);
          }}
          onDelete={deleteModel}
        />

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

      <AiModelFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isEditing={!!form.editingId}
        formModel={form.formModel}
        formErrors={form.formErrors}
        testApiSuccess={form.testApiSuccess}
        isTestingApi={form.isTestingApi}
        testApiError={form.testApiError}
        onProviderChange={form.handleProviderChange}
        onFieldChange={form.handleFieldChange}
        onTestApiKey={form.testApiKey}
        onSave={handleSave}
      />
    </>
  );
}
