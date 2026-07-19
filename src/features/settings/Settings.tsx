import { useEffect, useState, useMemo, useRef } from "react";
import { Checkbox } from "../../shared/components/controls/CheckBox";
import { Select } from "../../shared/components/controls/Select";
import MainContainer from "../../shared/components/MainContainer";
import { useSettingStore } from "./store/settingStore";
import type { WrongAnswerPunishment } from "./store/settingStore";
import {
  scheduleNotification,
  cancelDailyNotification,
} from "../../services/notificationService.ts";
import { LANGUAGES } from "../../shared/constants/languages";
import { categoryTagRepository } from "../../repositories/CategoryTagRepository.ts";
import { exportTables, importBackupZip, resolveDependencies, createBackupZip, saveBackupBlob, parseBackupZip } from "../../services/backupService.ts";
import type { BackupTable } from "../../types/backup.ts";
import type { CategoryTag } from "../../db/entities.ts";
import styles from "./Settings.module.css";

const PUNISHMENT_OPTIONS = [
  { value: "None" as WrongAnswerPunishment, label: "None" },
  { value: "JumpOneBoxBack" as WrongAnswerPunishment, label: "Jump one box back" },
  { value: "JumpToFirstBox" as WrongAnswerPunishment, label: "Jump to first box" },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString().padStart(2, "0"),
  label: i.toString().padStart(2, "0"),
}));

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: i.toString().padStart(2, "0"),
  label: i.toString().padStart(2, "0"),
}));

const LANGUAGE_OPTIONS = LANGUAGES.map(([value, label]) => ({ value, label }));

const TABLE_INFOS: { key: BackupTable; label: string }[] = [
  { key: "AiModels", label: "AiModels" },
  { key: "CustomPrompts", label: "CustomPrompts" },
  { key: "CategoryTags", label: "CategoryTags" },
  { key: "Boxes", label: "Boxes" },
  { key: "Cards", label: "Cards" },
  { key: "FreeResponseQuestions", label: "FreeResponseQuestions" },
  { key: "FillTheBlankQuestions", label: "FillTheBlankQuestions" },
  { key: "MultipleChoiceQuestions", label: "MultipleChoiceQuestions" },
];

export default function Settings() {
  const {
    wrongAnswerPunishment,
    setWrongAnswerPunishment,
    readAloudBadge,
    setReadAloudBadge,
    notification,
    setNotification,
    notificationHour,
    setNotificationHour,
    notificationMinute,
    setNotificationMinute,
    isShowTranslationControl,
    setIsShowTranslationControl,
    defaultTranslationTarget,
    setDefaultTranslationTarget,
  } = useSettingStore();

  useEffect(() => {
    if (notification) {
      scheduleNotification(notificationHour ?? 18, notificationMinute ?? 0);
    } else {
      cancelDailyNotification();
    }
  }, [notification, notificationHour, notificationMinute]);

  const [manualTables, setManualTables] = useState<Set<BackupTable>>(new Set());
  const [selectedTagId, setSelectedTagId] = useState<string | "all">("all");
  const [availableTags, setAvailableTags] = useState<CategoryTag[]>([]);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveTables = useMemo(() => new Set(resolveDependencies([...manualTables])), [manualTables]);
  const showTagFilter = effectiveTables.has("CategoryTags") || effectiveTables.has("Cards");

  useEffect(() => {
    categoryTagRepository.getAll().then(setAvailableTags);
  }, []);

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

  const backupDisabled = effectiveTables.size === 0;

  async function handleBackup() {
    setStatus(null);
    try {
      const tagFilter = selectedTagId === "all" ? "all" : [selectedTagId];
      const tables = await exportTables({ tables: [...effectiveTables], categoryTagFilter: tagFilter });
      const zipBlob = await createBackupZip(tables);
      const fileName = `leitnix-backup-${new Date().toISOString().slice(0, 10)}.leitnix`;
      await saveBackupBlob(zipBlob, fileName);
      showStatus("success", "Backup saved successfully.");
    } catch (err) {
      showStatus("error", `Backup failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(null);
    try {
      const tables = await parseBackupZip(file);
      const tableList = Object.keys(tables).join(", ");
      if (!window.confirm(`Restore backup? This will replace data in: ${tableList}`)) return;
      await importBackupZip(tables);
      showStatus("success", "Backup restored successfully.");
    } catch (err) {
      showStatus("error", `Restore failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
    e.target.value = "";
  }

  function showStatus(type: "success" | "error", message: string) {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 5000);
  }

  return (
    <MainContainer>
      <div className={styles.container}>
        <h1>settings</h1>
        <div className={styles.fields}>
          <Select
            label="Wrong answer punishment"
            value={wrongAnswerPunishment}
            items={PUNISHMENT_OPTIONS}
            onChange={setWrongAnswerPunishment}
          />

          <div className={styles.divider} />

          <Checkbox
            label="Enable notification"
            defaultChecked={notification}
            onChange={setNotification}
          />

          {notification && (
            <div className={styles.timePicker}>
              <div className={styles.timePickerLabel}>
                Notification time
              </div>
              <div className={styles.timeRow}>
                <div className={styles.timeField}>
                  <select
                    className={styles.timeSelect}
                    value={(notificationHour ?? 18).toString().padStart(2, "0")}
                    onChange={(e) => setNotificationHour(parseInt(e.target.value, 10))}
                  >
                    {HOUR_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <span className={styles.hint}>
                    hour
                  </span>
                </div>
                <span className={styles.colon}>
                  :
                </span>
                <div className={styles.timeField}>
                  <select
                    className={styles.timeSelect}
                    value={(notificationMinute ?? 0).toString().padStart(2, "0")}
                    onChange={(e) => setNotificationMinute(parseInt(e.target.value, 10))}
                  >
                    {MINUTE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <span className={styles.hint}>
                    minute
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.divider} />

          <div className={styles.checkboxRow}>
            <Checkbox
              label="Show translation controls"
              defaultChecked={isShowTranslationControl}
              onChange={setIsShowTranslationControl}
            />
            <Checkbox
              label="Show read-aloud badges"
              defaultChecked={readAloudBadge}
              onChange={setReadAloudBadge}
            />
          </div>

          {isShowTranslationControl && (
            <Select
              label="Default translation language"
              value={defaultTranslationTarget}
              items={LANGUAGE_OPTIONS}
              onChange={setDefaultTranslationTarget}
            />
          )}
        </div>

        <div className={styles.divider} />

        <div className={styles.backupSection}>
          <div className={styles.sectionTitle}>Data Management</div>

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

          <div className={styles.actionRow}>
            <button
              className={styles.backupButton}
              disabled={backupDisabled}
              onClick={handleBackup}
            >
              Backup
            </button>
            <button className={styles.restoreButton} onClick={() => fileInputRef.current?.click()}>
              Restore
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".leitnix"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {status && (
            <div className={`${styles.statusMessage} ${status.type === "success" ? styles.statusSuccess : styles.statusError}`}>
              {status.message}
            </div>
          )}
        </div>
      </div>
    </MainContainer>
  );
}
