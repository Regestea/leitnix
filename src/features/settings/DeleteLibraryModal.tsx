import { useState, useEffect } from "react";
import Modal from "../../shared/components/modal/Modal";
import { categoryTagRepository } from "../../repositories/CategoryTagRepository";
import type { TagProgressDto } from "../../dtos/TagProgressDto";
import styles from "./DeleteLibraryModal.module.css";

interface DeleteLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteLibraryModal({ isOpen, onClose }: DeleteLibraryModalProps) {
  const [tags, setTags] = useState<TagProgressDto[]>([]);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      categoryTagRepository.getTagsProgressWithCardCount().then(setTags);
      setSelectedTagId("");
    }
  }, [isOpen]);

  const selectedTag = tags.find((t) => t.Id === selectedTagId);

  async function handleDelete() {
    if (!selectedTagId || !selectedTag) return;

    if (
      !window.confirm(
        `Are you sure you want to delete "${selectedTag.Name}"?\n\n` +
          `This will permanently delete all ${selectedTag.TotalCount} cards and their questions. This action cannot be undone.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await categoryTagRepository.deleteCascade(selectedTagId);
      onClose();
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Library" size="sm">
      <p className={styles.warning}>
        Select a category tag to permanently delete. All cards and questions under this tag
        will be removed. This action cannot be undone.
      </p>

      <div className={styles.tagSection}>
        <div className={styles.tagLabel}>Category tag</div>
        <select
          className={styles.tagSelect}
          value={selectedTagId}
          onChange={(e) => setSelectedTagId(e.target.value)}
        >
          <option value="">Select a tag...</option>
          {tags.map((tag) => (
            <option key={tag.Id} value={tag.Id}>
              {tag.Name} ({tag.TotalCount} cards)
            </option>
          ))}
        </select>
      </div>

      {selectedTag && selectedTag.TotalCount > 0 && (
        <div className={styles.deleteInfo}>
          Deleting <strong>{selectedTag.Name}</strong> will remove{" "}
          <strong>
            {selectedTag.TotalCount} card{selectedTag.TotalCount !== 1 ? "s" : ""}
          </strong>{" "}
          and all their questions.
        </div>
      )}

      {selectedTag && selectedTag.TotalCount === 0 && (
        <div className={styles.deleteInfoEmpty}>
          This tag has no cards. The tag itself will be removed.
        </div>
      )}

      <div className={styles.buttonRow}>
        <button className={styles.cancelButton} onClick={onClose} disabled={deleting}>
          Cancel
        </button>
        <button
          className={styles.deleteButton}
          disabled={!selectedTagId || deleting}
          onClick={handleDelete}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
