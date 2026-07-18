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
  isShowTranslationControl: boolean;
  defaultTranslationTarget: string;

  setWrongAnswerPunishment: (value: WrongAnswerPunishment) => void;
  setNotification: (value: boolean) => void;
  setNotificationHour: (value: number | null) => void;
  setNotificationMinute: (value: number | null) => void;
  setIsShowTranslationControl: (value: boolean) => void;
  setDefaultTranslationTarget: (value: string) => void;
}

const sqliteStorage: StateStorage = {
  getItem: async () => {
    const row = await settingRepository.getOrCreateDefaults();

    const state = {
      wrongAnswerPunishment: row.WrongAnswerPunishment as WrongAnswerPunishment,
      notification: row.Notification,
      notificationHour: row.NotificationHour,
      notificationMinute: row.NotificationMinute,
      isShowTranslationControl: !!row.IsShowTranslationControl,
      defaultTranslationTarget: row.DefaultTranslationTarget,
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
      IsShowTranslationControl: state.isShowTranslationControl,
      DefaultTranslationTarget: state.defaultTranslationTarget,
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
      isShowTranslationControl: false,
      defaultTranslationTarget: "fa",

      setWrongAnswerPunishment: (wrongAnswerPunishment) =>
        set({ wrongAnswerPunishment }),

      setNotification: (notification) => set({ notification }),

      setNotificationHour: (notificationHour) => set({ notificationHour }),

      setNotificationMinute: (notificationMinute) =>
        set({ notificationMinute }),

      setIsShowTranslationControl: (isShowTranslationControl) =>
        set({ isShowTranslationControl }),

      setDefaultTranslationTarget: (defaultTranslationTarget) =>
        set({ defaultTranslationTarget }),
    }),
    {
      name: "leitnix-settings",
      storage: createJSONStorage(() => sqliteStorage),
      skipHydration: true,
    },
  ),
);
