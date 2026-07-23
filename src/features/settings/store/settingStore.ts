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
  readAloudBadge: boolean;
  notification: boolean;
  notificationHour: number | null;
  notificationMinute: number | null;
  isShowTranslationControl: boolean;
  defaultTranslationTarget: string;
  easyReadMode: boolean;
  easyReadBackgroundColor: string;
  easyReadTextColor: string;

  setWrongAnswerPunishment: (value: WrongAnswerPunishment) => void;
  setReadAloudBadge: (value: boolean) => void;
  setNotification: (value: boolean) => void;
  setNotificationHour: (value: number | null) => void;
  setNotificationMinute: (value: number | null) => void;
  setIsShowTranslationControl: (value: boolean) => void;
  setDefaultTranslationTarget: (value: string) => void;
  setEasyReadMode: (value: boolean) => void;
  setEasyReadBackgroundColor: (value: string) => void;
  setEasyReadTextColor: (value: string) => void;
}

const sqliteStorage: StateStorage = {
  getItem: async () => {
    const row = await settingRepository.getOrCreateDefaults();

    const state = {
      wrongAnswerPunishment: row.WrongAnswerPunishment as WrongAnswerPunishment,
      readAloudBadge: !!row.ReadAloudBadge,
      notification: row.Notification,
      notificationHour: row.NotificationHour,
      notificationMinute: row.NotificationMinute,
      isShowTranslationControl: !!row.IsShowTranslationControl,
      defaultTranslationTarget: row.DefaultTranslationTarget,
      easyReadMode: !!row.EasyReadMode,
      easyReadBackgroundColor: row.EasyReadBackgroundColor,
      easyReadTextColor: row.EasyReadTextColor,
    };

    return JSON.stringify({ state, version: 0 });
  },

  setItem: async (name, value) => {
    void name;

    const { state } = JSON.parse(value);

    await settingRepository.update({
      WrongAnswerPunishment: state.wrongAnswerPunishment,
      ReadAloudBadge: state.readAloudBadge,
      Notification: state.notification,
      NotificationHour: state.notificationHour,
      NotificationMinute: state.notificationMinute,
      IsShowTranslationControl: state.isShowTranslationControl,
      DefaultTranslationTarget: state.defaultTranslationTarget,
      EasyReadMode: state.easyReadMode,
      EasyReadBackgroundColor: state.easyReadBackgroundColor,
      EasyReadTextColor: state.easyReadTextColor,
    });
  },

  removeItem: async () => {},
};

export const useSettingStore = create<SettingState>()(
  persist(
    (set) => ({
      wrongAnswerPunishment: "None",
      readAloudBadge: false,
      notification: false,
      notificationHour: 18,
      notificationMinute: null,
      isShowTranslationControl: false,
      defaultTranslationTarget: "fa",
      easyReadMode: false,
      easyReadBackgroundColor: "#1e1e1e",
      easyReadTextColor: "#dcdcdc",

      setWrongAnswerPunishment: (wrongAnswerPunishment) =>
        set({ wrongAnswerPunishment }),

      setReadAloudBadge: (readAloudBadge) => set({ readAloudBadge }),

      setNotification: (notification) => set({ notification }),

      setNotificationHour: (notificationHour) => set({ notificationHour }),

      setNotificationMinute: (notificationMinute) =>
        set({ notificationMinute }),

      setIsShowTranslationControl: (isShowTranslationControl) =>
        set({ isShowTranslationControl }),

      setDefaultTranslationTarget: (defaultTranslationTarget) =>
        set({ defaultTranslationTarget }),

      setEasyReadMode: (easyReadMode) => set({ easyReadMode }),

      setEasyReadBackgroundColor: (easyReadBackgroundColor) =>
        set({ easyReadBackgroundColor }),

      setEasyReadTextColor: (easyReadTextColor) =>
        set({ easyReadTextColor }),
    }),
    {
      name: "leitnix-settings",
      storage: createJSONStorage(() => sqliteStorage),
      skipHydration: true,
    },
  ),
);
