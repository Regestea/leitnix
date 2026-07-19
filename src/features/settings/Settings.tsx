import { useEffect, useState, useRef } from "react";
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
import { parseBackupZip } from "../../services/backupService.ts";
import type { BackupDataPerTable } from "../../types/backup.ts";
import type { CategoryTag } from "../../db/entities.ts";
import styles from "./Settings.module.css";
import BackupModal from "./BackupModal.tsx";
import RestoreModal from "./RestoreModal.tsx";

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

  const [availableTags, setAvailableTags] = useState<CategoryTag[]>([]);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [restoreData, setRestoreData] = useState<BackupDataPerTable | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    categoryTagRepository.getAll().then(setAvailableTags);
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const tables = await parseBackupZip(file);
      setRestoreData(tables);
      setRestoreModalOpen(true);
    } catch (err) {
      alert(`Restore failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return (
    <MainContainer>
      <div className={styles.container}>
        <h3 className={styles.pageHeading}>Settings</h3>
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

          <div className={styles.actionRow}>
            <button className={styles.backupButton} onClick={() => setBackupModalOpen(true)}>
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
        </div>
      </div>

      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        availableTags={availableTags}
      />

      {restoreData && (
        <RestoreModal
          isOpen={restoreModalOpen}
          onClose={() => { setRestoreModalOpen(false); setRestoreData(null); }}
          backupData={restoreData}
        />
      )}
    </MainContainer>
  );
}
