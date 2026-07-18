import { LocalNotifications } from "@capacitor/local-notifications";
import { cardRepository } from "../repositories/CardRepository";
import { settingRepository } from "../repositories/SettingRepository";

const NOTIFICATION_ID = 1;

export async function requestNotificationPermission(): Promise<boolean> {
  const { display } = await LocalNotifications.checkPermissions();
  if (display === "granted") return true;

  const result = await LocalNotifications.requestPermissions();
  return result.display === "granted";
}

export async function rescheduleDailyNotification(): Promise<void> {
  await cancelNotification();

  const setting = await settingRepository.getOrCreateDefaults();
  if (!setting.Notification) return;

  const hour = setting.NotificationHour ?? 18;
  const minute = setting.NotificationMinute ?? 0;

  const count = await cardRepository.overallReviewToday();
  if (count === 0) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: NOTIFICATION_ID,
        title: "Leitnix — Review Time",
        body: `You have ${count} card${count === 1 ? "" : "s"} to review today.`,
        schedule: {
          on: { hour, minute },
          repeats: true,
        },
      },
    ],
  });
}

async function cancelNotification(): Promise<void> {
  const pending = await LocalNotifications.getPending();
  const existing = pending.notifications.find(
    (n) => n.id === NOTIFICATION_ID,
  );
  if (existing) {
    await LocalNotifications.cancel({ notifications: [existing] });
  }
}

export async function cancelDailyNotification(): Promise<void> {
  await cancelNotification();
}

export async function scheduleNotification(
  hour: number,
  minute: number,
): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await cancelNotification();

  const count = await cardRepository.overallReviewToday();
  if (count === 0) return;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: NOTIFICATION_ID,
        title: "Leitnix — Review Time",
        body: `You have ${count} card${count === 1 ? "" : "s"} to review today.`,
        schedule: {
          on: { hour, minute },
          repeats: true,
        },
      },
    ],
  });
}
