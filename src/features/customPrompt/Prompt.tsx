import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MainContainer from "../../shared/components/MainContainer";
import { Button } from "../../shared/components/controls/Button";
import { Input } from "../../shared/components/controls/Input";
import { Textarea } from "../../shared/components/controls/Textarea";
import Modal from "../../shared/components/Modal";
import type { CustomPrompt } from "../../db/schema";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import "./Prompt.css";
import { CustomPromptRepository } from "../../repositories/CustomPromptRepository";

const EMPTY_PROMPT: CustomPrompt = {
  Id: "",
  Name: null,
  Prompt: null,
};

const customPromptFormSchema = z.object({
  Name: z.string().trim().min(1, "Name is required."),
  Prompt: z.string().trim().min(1, "Prompt is required."),
});

type CustomPromptFormErrors = Partial<
  Record<keyof z.infer<typeof customPromptFormSchema>, string>
>;

function validateFormPrompt(prompt: CustomPrompt): {
  success: boolean;
  errors: CustomPromptFormErrors;
} {
  const result = customPromptFormSchema.safeParse({
    Name: prompt.Name ?? "",
    Prompt: prompt.Prompt ?? "",
  });

  if (result.success) {
    return { success: true, errors: {} };
  }

  const errors: CustomPromptFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CustomPromptFormErrors;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}

export default function Prompt() {
  const repository = useMemo(() => new CustomPromptRepository(), []);

  const [prompts, setPrompts] = useState<CustomPrompt[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formPrompt, setFormPrompt] = useState<CustomPrompt>(EMPTY_PROMPT);
  const [formErrors, setFormErrors] = useState<CustomPromptFormErrors>({});

  useEffect(() => {
    let cancelled = false;
    repository.getAll().then((data) => {
      if (!cancelled) setPrompts(data);
    });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const openAddModal = () => {
    setEditingId(null);
    setFormPrompt(EMPTY_PROMPT);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (prompt: CustomPrompt) => {
    setEditingId(prompt.Id);
    setFormPrompt(prompt);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormPrompt(EMPTY_PROMPT);
    setFormErrors({});
  };

  const handleDelete = async (id: string) => {
    await repository.delete(id);
    setPrompts((prev) => prev.filter((p) => p.Id !== id));
  };

  const handleFieldChange = (
    field: Exclude<keyof CustomPrompt, "Id">,
    value: string,
  ) => {
    setFormPrompt((prev: CustomPrompt) => ({
      ...prev,
      [field]: value === "" ? null : value,
    }));
    setFormErrors((prev: CustomPromptFormErrors) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field as keyof CustomPromptFormErrors];
      return next;
    });
  };

  const handleSave = async () => {
    const { success, errors } = validateFormPrompt(formPrompt);
    setFormErrors(errors);
    if (!success) return;

    if (editingId) {
      const updated: CustomPrompt = { ...formPrompt, Id: editingId };
      await repository.update(updated);
      setPrompts((prev) => prev.map((p) => (p.Id === editingId ? updated : p)));
    } else {
      const newPrompt: CustomPrompt = {
        ...formPrompt,
        Id: crypto.randomUUID(),
      };
      await repository.create(newPrompt);
      setPrompts((prev) => [...prev, newPrompt]);
    }
    closeModal();
  };

  return (
    <>
      <MainContainer>
        <div className="custom-prompt-form">
          {prompts.length === 0 ? (
            <p className="no-prompts-text">No custom prompts added yet.</p>
          ) : (
            prompts.map((prompt) => (
              <div className="prompt-item" key={prompt.Id}>
                <h4>{prompt.Name ?? "Untitled Prompt"}</h4>
                <div className="prompt-control-menu">
                  <span
                    className="prompt-control-menu"
                    onClick={() => openEditModal(prompt)}
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </span>
                  <span
                    className="prompt-control-menu"
                    onClick={() => handleDelete(prompt.Id)}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

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

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <h1>{editingId ? "Edit Prompt" : "Add New Prompt"}</h1>
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
                onChange={(e) => handleFieldChange("Name", e)}
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
                onChange={(e) => handleFieldChange("Prompt", e)}
                rows={15}
              />
              {formErrors.Prompt && (
                <p className="field-error">{formErrors.Prompt}</p>
              )}
            </div>
          </div>
        </div>

        <div
          style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}
        >
          <Button className="secondary" label="Cancel" onClick={closeModal} />
          <Button
            label={editingId ? "Save Changes" : "Save"}
            onClick={handleSave}
          />
        </div>
      </Modal>
    </>
  );
}
