import { useState, useMemo } from "react";
import Modal from "../../shared/components/Modal";
import { importBackupZip, resolveDependencies } from "../../services/backupService";
import type { BackupTable, BackupDataPerTable } from "../../types/backup";
import styles from "./BackupModal.module.css";

const TABLE_LABELS: Record<string, string> = {
  AiModels: "AI Models",
  CustomPrompts: "Custom Prompts",
  CategoryTags: "Category Tags",
  Boxes: "Boxes",
  Cards: "Cards",
  FreeResponseQuestions: "Free Response Questions",
  FillTheBlankQuestions: "Fill the Blank Questions",
  MultipleChoiceQuestions: "Multiple Choice Questions",
};

const DEPENDENTS: Record<BackupTable, BackupTable[]> = {
  AiModels: [],
  CustomPrompts: [],
  CategoryTags: [],
  Boxes: [],
  Cards: ["FreeResponseQuestions", "FillTheBlankQuestions", "MultipleChoiceQuestions"],
  FreeResponseQuestions: [],
  FillTheBlankQuestions: [],
  MultipleChoiceQuestions: [],
};

function tableLabel(key: string): string {
  return TABLE_LABELS[key] ?? key;
}

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupData: BackupDataPerTable;
}

export default function RestoreModal({ isOpen, onClose, backupData }: RestoreModalProps) {
  const availableTables = Object.keys(backupData) as BackupTable[];
  const [manualTables, setManualTables] = useState<Set<BackupTable>>(new Set(availableTables));
  const [selectedTagId, setSelectedTagId] = useState<string | "all">("all");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const effectiveTables = useMemo(() => {
    const resolved = resolveDependencies([...manualTables]);
    return new Set(resolved.filter((t) => availableTables.includes(t)));
  }, [manualTables, availableTables]);

  const backupTags = useMemo(() => {
    const tags = backupData.CategoryTags;
    if (!tags) return [];
    return tags.map((t) => t as { Id: string; Name: string });
  }, [backupData]);

  const showTagFilter = effectiveTables.has("CategoryTags") && effectiveTables.has("Cards") && backupTags.length > 0;
  const restoreDisabled = effectiveTables.size === 0;

  function handleTableToggle(table: BackupTable, checked: boolean) {
    setManualTables((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(table);
      } else {
        next.delete(table);
        for (const dep of DEPENDENTS[table]) {
          next.delete(dep);
        }
      }
      return next;
    });
  }

  function getTableFilteredData(): BackupDataPerTable {
    const filtered: BackupDataPerTable = {};

    for (const table of availableTables) {
      if (effectiveTables.has(table)) {
        filtered[table] = backupData[table];
      }
    }

    if (selectedTagId !== "all" && backupTags.length > 0) {
      if (effectiveTables.has("CategoryTags")) {
        filtered.CategoryTags = (backupData.CategoryTags ?? []).filter(
          (t) => (t as { Id: string }).Id === selectedTagId,
        );
      }

      if (effectiveTables.has("Cards")) {
        filtered.Cards = (backupData.Cards ?? []).filter(
          (c) => (c as { CategoryTagId: string | null }).CategoryTagId === selectedTagId,
        );
      }

      const filteredCardIds = new Set((filtered.Cards ?? []).map((c) => (c as { Id: string }).Id));

      if (effectiveTables.has("FreeResponseQuestions")) {
        filtered.FreeResponseQuestions = (backupData.FreeResponseQuestions ?? []).filter(
          (q) => filteredCardIds.has((q as { CardId: string }).CardId),
        );
      }

      if (effectiveTables.has("FillTheBlankQuestions")) {
        filtered.FillTheBlankQuestions = (backupData.FillTheBlankQuestions ?? []).filter(
          (q) => filteredCardIds.has((q as { CardId: string }).CardId),
        );
      }

      if (effectiveTables.has("MultipleChoiceQuestions")) {
        filtered.MultipleChoiceQuestions = (backupData.MultipleChoiceQuestions ?? []).filter(
          (q) => filteredCardIds.has((q as { CardId: string }).CardId),
        );
      }
    }

    return filtered;
  }

  async function handleRestore() {
    setStatus(null);
    try {
      const filtered = getTableFilteredData();
      const tableList = Object.keys(filtered).join(", ");
      if (!window.confirm(`Restore backup? This will replace data in: ${tableList}`)) return;
      await importBackupZip(filtered);
      setStatus({ type: "success", message: "Backup restored successfully." });
    } catch (err) {
      setStatus({ type: "error", message: `Restore failed: ${err instanceof Error ? err.message : "Unknown error"}` });
    }
  }

  function handleClose() {
    setManualTables(new Set(availableTables));
    setSelectedTagId("all");
    setStatus(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Restore" size="sm">
      <p className={styles.restoreHint}>Select tables to restore:</p>

      <div className={styles.tableGrid}>
        {availableTables.map((table) => {
          const checked = effectiveTables.has(table);
          const forced = checked && !manualTables.has(table);
          const rowCount = (backupData[table] ?? []).length;
          return (
            <label key={table} className={styles.tableCheckbox} style={{ opacity: forced ? 0.6 : 1 }}>
              <input
                type="checkbox"
                checked={checked}
                disabled={forced}
                onChange={(e) => handleTableToggle(table, e.target.checked)}
              />
              {tableLabel(table)}
              {forced && <span className={styles.requiredBadge}>(required)</span>}
              <span className={styles.rowCount}>({rowCount})</span>
            </label>
          );
        })}
      </div>

      {showTagFilter && (
        <div className={styles.tagFilterSection}>
          <div className={styles.tagFilterLabel}>Restore only cards for a specific tag</div>
          <select
            className={styles.tagSelect}
            value={selectedTagId}
            onChange={(e) => setSelectedTagId(e.target.value as string | "all")}
          >
            <option value="all">All tags</option>
            {backupTags.map((tag) => (
              <option key={tag.Id} value={tag.Id}>
                {tag.Name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.buttonRow}>
        <button className={styles.cancelButton} onClick={handleClose}>Cancel</button>
        <button className={styles.primaryButton} disabled={restoreDisabled} onClick={handleRestore}>
          Restore
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
