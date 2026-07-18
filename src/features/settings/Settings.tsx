import { useEffect } from "react";
import { Checkbox } from "../../shared/components/controls/CheckBox";
import { Select } from "../../shared/components/controls/Select";
import MainContainer from "../../shared/components/MainContainer";
import { useSettingStore } from "./store/settingStore";
import type { WrongAnswerPunishment } from "./store/settingStore";
import {
  scheduleNotification,
  cancelDailyNotification,
} from "../../services/notificationService.ts";

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

export default function Settings() {
  const {
    wrongAnswerPunishment,
    setWrongAnswerPunishment,
    notification,
    setNotification,
    notificationHour,
    setNotificationHour,
    notificationMinute,
    setNotificationMinute,
  } = useSettingStore();

  useEffect(() => {
    if (notification) {
      scheduleNotification(notificationHour ?? 18, notificationMinute ?? 0);
    } else {
      cancelDailyNotification();
    }
  }, [notification, notificationHour, notificationMinute]);

  return (
    <MainContainer>
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <Select
            label="Wrong answer punishment"
            value={wrongAnswerPunishment}
            items={PUNISHMENT_OPTIONS}
            onChange={setWrongAnswerPunishment}
          />

          <Checkbox
            label="Enable notification"
            defaultChecked={notification}
            onChange={setNotification}
          />

          {notification && (
            <>
              <Select
                label="Notification hour"
                value={(notificationHour ?? 18).toString().padStart(2, "0")}
                items={HOUR_OPTIONS}
                onChange={(v) => setNotificationHour(parseInt(v, 10))}
              />
              <Select
                label="Notification minute"
                value={(notificationMinute ?? 0).toString().padStart(2, "0")}
                items={MINUTE_OPTIONS}
                onChange={(v) => setNotificationMinute(parseInt(v, 10))}
              />
            </>
          )}
        </div>
      </div>
    </MainContainer>
  );
}
