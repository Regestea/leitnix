import { db } from "../db/leitnixDB";
import type { Setting } from "../db/schema";

const SETTINGS_ID = "app-settings";

const DEFAULT_SETTINGS: Omit<Setting, "Id"> = {
  FontFamily: "comic",
  FontSize: "medium",
  FontWeight: "normal",
  Theme: "Dark",
  AndroidNavigation: true,
};

export const SettingRepository = {
  async get(): Promise<Setting | null> {
    const result = await db.query("SELECT * FROM Setting WHERE Id = ?;", [
      SETTINGS_ID,
    ]);
    const row = result.values?.[0];
    if (!row) return null;

    return {
      ...(row as Setting),
      AndroidNavigation: !!row.AndroidNavigation,
    };
  },

  async upsert(setting: Omit<Setting, "Id">): Promise<void> {
    await db.run(
      `INSERT INTO Setting (Id, FontFamily, FontSize, FontWeight, Theme, AndroidNavigation)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(Id) DO UPDATE SET
         FontFamily = excluded.FontFamily,
         FontSize   = excluded.FontSize,
         FontWeight = excluded.FontWeight,
         Theme      = excluded.Theme,
         AndroidNavigation = excluded.AndroidNavigation;`,
      [
        SETTINGS_ID,
        setting.FontFamily,
        setting.FontSize,
        setting.FontWeight,
        setting.Theme,
        setting.AndroidNavigation ? 1 : 0,
      ],
    );
  },

  async getOrCreateDefaults(): Promise<Setting> {
    const existing = await this.get();
    if (existing) return existing;

    await this.upsert(DEFAULT_SETTINGS);
    return { Id: SETTINGS_ID, ...DEFAULT_SETTINGS };
  },
};