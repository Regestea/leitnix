import { getDb } from "../db/connection";
import type { Theme } from "../db/entities.ts";

export interface IThemeRepository {
  upsert(theme: Omit<Theme, "Id">): Promise<void>;
  getOrCreateDefaults(): Promise<Theme>;
}

const Theme_ID = "app-theme";

const DEFAULT_Theme: Omit<Theme, "Id"> = {
  FontFamily: "comic",
  FontSize: "medium",
  FontWeight: "normal",
  Theme: "Dark",
  AndroidNavigation: true,
};

export class ThemeRepository {
  async upsert(theme: Omit<Theme, "Id">): Promise<void> {
    const db = await getDb();
    await db.run(
      `INSERT INTO Theme (Id, FontFamily, FontSize, FontWeight, Theme, AndroidNavigation)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(Id) DO UPDATE SET
         FontFamily = excluded.FontFamily,
         FontSize   = excluded.FontSize,
         FontWeight = excluded.FontWeight,
         Theme      = excluded.Theme,
         AndroidNavigation = excluded.AndroidNavigation;`,
      [
        Theme_ID,
        theme.FontFamily,
        theme.FontSize,
        theme.FontWeight,
        theme.Theme,
        theme.AndroidNavigation ? 1 : 0,
      ],
    );
  }

  async getOrCreateDefaults(): Promise<Theme> {
    const db = await getDb();
    const result = await db.query("SELECT * FROM Theme WHERE Id = ?;", [
      Theme_ID,
    ]);
    const row = result.values?.[0];
    if (row) {
      return {
        ...(row as Theme),
        AndroidNavigation: !!row.AndroidNavigation,
      };
    }

    await this.upsert(DEFAULT_Theme);
    return { Id: Theme_ID, ...DEFAULT_Theme };
  }
}

export const themeRepository: IThemeRepository = new ThemeRepository();
