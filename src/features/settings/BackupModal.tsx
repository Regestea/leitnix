import { useState, useMemo } from "react";
import Modal from "../../shared/components/Modal";
import { exportTables, resolveDependencies, createBackupZip, saveBackupBlob } from "../../services/backupService";
import type { BackupTable } from "../../types/backup";
import type { CategoryTag } from "../../db/entities";
import styles from "./BackupModal.module.css";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTags: CategoryTag[];
}

const TABLE_INFOS: { key: BackupTable; label: string }[] = [
  { key: "AiModels", label: "AI Models" },
  { key: "CustomPrompts", label: "Custom Prompts" },
  { key: "CategoryTags", label: "Category Tags" },
  { key: "Boxes", label: "Boxes" },
  { key: "Cards", label: "Cards" },
  { key: "FreeResponseQuestions", label: "Free Response Questions" },
  { key: "FillTheBlankQuestions", label: "Fill the Blank Questions" },
  { key: "MultipleChoiceQuestions", label: "Multiple Choice Questions" },
];

export default function BackupModal({ isOpen, onClose, availableTags }: BackupModalProps) {
  const [manualTables, setManualTables] = useState<Set<BackupTable>>(new Set());
  const [selectedTagId, setSelectedTagId] = useState<string | "all">("all");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const effectiveTables = useMemo(() => new Set(resolveDependencies([...manualTables])), [manualTables]);
  const showTagFilter = effectiveTables.has("CategoryTags") || effectiveTables.has("Cards");
  const backupDisabled = effectiveTables.size === 0;

  function handleTableToggle(table: BackupTable, checked: boolean) {
    setManualTables((prev) => {
      const next = new Set(prev);
      if (checked) next.add(table);
      else next.delete(table);
      return next;
    });
  }

  function handleTagChange(tagId: string | "all") {
    setSelectedTagId(tagId);
  }

  async function handleBackup() {
    setStatus(null);
    try {
      const tagFilter = selectedTagId === "all" ? "all" : [selectedTagId];
      const tables = await exportTables({ tables: [...effectiveTables], categoryTagFilter: tagFilter });
      const zipData = await createBackupZip(tables);
      const fileName = `leitnix-backup-${new Date().toISOString().slice(0, 10)}.leitnix`;
      await saveBackupBlob(zipData, fileName);
      setStatus({ type: "success", message: "Backup saved successfully." });
    } catch (err) {
      setStatus({ type: "error", message: `Backup failed: ${err instanceof Error ? err.message : "Unknown error"}` });
    }
  }

  function handleClose() {
    setManualTables(new Set());
    setSelectedTagId("all");
    setStatus(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Backup" size="sm">
      <div className={styles.tableGrid}>
        {TABLE_INFOS.map(({ key, label }) => {
          const checked = effectiveTables.has(key);
          const forced = checked && !manualTables.has(key);
          return (
            <label key={key} className={styles.tableCheckbox} style={{ opacity: forced ? 0.6 : 1 }}>
              <input
                type="checkbox"
                checked={checked}
                disabled={forced}
                onChange={(e) => handleTableToggle(key, e.target.checked)}
              />
              {label}
              {forced && <span className={styles.requiredBadge}>(required)</span>}
            </label>
          );
        })}
      </div>

      {showTagFilter && availableTags.length > 0 && (
        <div className={styles.tagFilterSection}>
          <div className={styles.tagFilterLabel}>Category tag filter</div>
          <select
            className={styles.tagSelect}
            value={selectedTagId}
            onChange={(e) => handleTagChange(e.target.value as string | "all")}
          >
            <option value="all">All tags</option>
            {availableTags.map((tag) => (
              <option key={tag.Id} value={tag.Id}>
                {tag.Name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.buttonRow}>
        <button className={styles.cancelButton} onClick={handleClose}>Cancel</button>
        <button className={styles.primaryButton} disabled={backupDisabled} onClick={handleBackup}>
          Backup
        </button>
      </div>

      {status && (
        <div className={`${styles.statusMessage} ${status.type === "success" ? styles.statusSuccess : styles.statusError}`}>
          {status.message}
        </div>
      )}
    </Modal>
  );
}
