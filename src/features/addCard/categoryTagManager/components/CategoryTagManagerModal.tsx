import { useState, useMemo } from "react";
import { Button } from "../../../../shared/components/controls/Button";
import { Select } from "../../../../shared/components/controls/Select";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import Modal from "../../../../shared/components/Modal";
import { CardRepository } from "../../../../repositories/CardRepository";
import { useCategoryTags } from "../hooks/useCategoryTags";
import { useCategoryTagForm } from "../hooks/useCategoryTagForm";
import CategoryTagList from "./CategoryTagList";
import CategoryTagFormModal from "./CategoryTagFormModal";
import styles from "../../AddCard.module.css";

interface CategoryTagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTagsChange: () => void;
}

export default function CategoryTagManagerModal({
  isOpen,
  onClose,
  onTagsChange,
}: CategoryTagManagerModalProps) {
  const { tags, addTag, updateTag, deleteTag } = useCategoryTags();
  const form = useCategoryTagForm();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [reassignTagId, setReassignTagId] = useState("");
  const [hasAttachedCards, setHasAttachedCards] = useState(false);

  // ── Add / Edit flow ───────────────────────────────────────────────

  const openAddModal = () => {
    form.openAdd();
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    form.reset();
    setIsFormModalOpen(false);
  };

  const handleSave = async () => {
    if (!form.validate()) return;

    if (form.editingId) {
      await updateTag({ ...form.formTag, Id: form.editingId });
    } else {
      const newTag = {
        ...form.formTag,
        Id: crypto.randomUUID(),
      };
      await addTag(newTag);
    }
    closeFormModal();
    onTagsChange();
  };

  // ── Delete flow ───────────────────────────────────────────────────

  const handleDeleteClick = async (id: string) => {
    const cardRepo = new CardRepository();
    const cards = await cardRepo.getByCategoryTagId(id);
    // Default the reassignment target to the first remaining tag so the
    // Select's controlled value matches an actual option. Otherwise the
    // visually-preselected first option never fires a `change` event,
    // reassignTagId stays "" and the button stays disabled.
    const fallbackTag = tags.find((t) => t.Id !== id);
    setDeleteTargetId(id);
    setReassignTagId(fallbackTag?.Id ?? "");
    setHasAttachedCards(cards.length > 0);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    await deleteTag(deleteTargetId, hasAttachedCards ? reassignTagId : undefined);
    setDeleteTargetId(null);
    setReassignTagId("");
    setHasAttachedCards(false);
    onTagsChange();
  };

  const handleDeleteCancel = () => {
    setDeleteTargetId(null);
    setReassignTagId("");
    setHasAttachedCards(false);
  };

  // ── Reassignment select options (exclude the tag being deleted) ────

  const reassignOptions = useMemo(() => {
    if (!deleteTargetId) return [];
    return tags
      .filter((t) => t.Id !== deleteTargetId)
      .map((t) => ({
        value: t.Id,
        label: t.Name ?? "Unnamed",
      }));
  }, [tags, deleteTargetId]);

  const canConfirmDelete = !hasAttachedCards || reassignTagId !== "";

  // ── Render ───────────────────────────────────────────────────────

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Manage Category Tags">
        <CategoryTagList
          tags={tags}
          onEdit={(tag) => {
            form.openEdit(tag);
            setIsFormModalOpen(true);
          }}
          onDelete={handleDeleteClick}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Button
            className={styles.formAddNewTag}
            label="Add New Tag"
            onClick={openAddModal}
          />
        </div>
      </Modal>

      <CategoryTagFormModal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        isEditing={!!form.editingId}
        tagName={form.formTag.Name ?? ""}
        formErrors={form.formErrors}
        onNameChange={form.handleFieldChange}
        onSave={handleSave}
      />

      {/* No cards attached — simple confirm */}
      {!hasAttachedCards && (
        <ConfirmModal
          isOpen={deleteTargetId !== null}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          message="Are you sure you want to delete this tag?"
        />
      )}

      {/* Cards attached — reassign flow */}
      {hasAttachedCards && (
        <Modal
          isOpen={deleteTargetId !== null}
          onClose={handleDeleteCancel}
          title="Reassign Cards"
          size="sm"
        >
          <p style={{ textAlign: "center", margin: "0.5rem 0 1rem" }}>
            This tag is used by some cards. Select a new tag to reassign them
            to:
          </p>
          <div style={{ marginBottom: "1rem" }}>
            <Select
              label="Reassign to"
              value={reassignTagId}
              items={reassignOptions}
              onChange={setReassignTagId}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
            <Button className="secondary" label="Cancel" onClick={handleDeleteCancel} />
            <Button
              label="Reassign & Delete"
              onClick={handleDeleteConfirm}
              disabled={!canConfirmDelete}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
