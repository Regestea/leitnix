import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";
import type { WrongAnswerPunishment } from "../../../db/entities.ts";
import { settingRepository } from "../../../repositories/SettingRepository";

export type { WrongAnswerPunishment };

interface SettingState {
  wrongAnswerPunishment: WrongAnswerPunishment;
  notification: boolean;
  notificationHour: number | null;
  notificationMinute: number | null;

  setWrongAnswerPunishment: (value: WrongAnswerPunishment) => void;
  setNotification: (value: boolean) => void;
  setNotificationHour: (value: number | null) => void;
  setNotificationMinute: (value: number | null) => void;
}

const sqliteStorage: StateStorage = {
  getItem: async () => {
    const row = await settingRepository.getOrCreateDefaults();

    const state = {
      wrongAnswerPunishment: row.WrongAnswerPunishment as WrongAnswerPunishment,
      notification: row.Notification,
      notificationHour: row.NotificationHour,
      notificationMinute: row.NotificationMinute,
    };

    return JSON.stringify({ state, version: 0 });
  },

  setItem: async (name, value) => {
    void name;

    const { state } = JSON.parse(value);

    await settingRepository.update({
      WrongAnswerPunishment: state.wrongAnswerPunishment,
      Notification: state.notification,
      NotificationHour: state.notificationHour,
      NotificationMinute: state.notificationMinute,
    });
  },

  removeItem: async () => {},
};

export const useSettingStore = create<SettingState>()(
  persist(
    (set) => ({
      wrongAnswerPunishment: "None",
      notification: false,
      notificationHour: 18,
      notificationMinute: null,

      setWrongAnswerPunishment: (wrongAnswerPunishment) =>
        set({ wrongAnswerPunishment }),

      setNotification: (notification) => set({ notification }),

      setNotificationHour: (notificationHour) => set({ notificationHour }),

      setNotificationMinute: (notificationMinute) =>
        set({ notificationMinute }),
    }),
    {
      name: "leitnix-settings",
      storage: createJSONStorage(() => sqliteStorage),
      skipHydration: true,
    },
  ),
);
