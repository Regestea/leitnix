import { getDb } from "../db/connection";
import type { Setting } from "../db/entities.ts";
import type { ISettingRepository } from "../iRepositories/ISettingRepository.ts";

export class SettingRepository implements ISettingRepository {
  async get(): Promise<Setting | null> {
    const db = await getDb();
    const result = await db.query("SELECT * FROM Setting LIMIT 1;");
    const rows = result.values ?? [];
    return rows.length > 0 ? (rows[0] as Setting) : null;
  }

  async update(setting: Setting): Promise<void> {
    const db = await getDb();
    await db.run(
      `UPDATE Setting
       SET WrongAnswerPunishment     = ?,
           Notification              = ?,
           NotificationHour          = ?,
           NotificationMinute        = ?,
           IsShowTranslationControl  = ?,
           DefaultTranslationTarget  = ?;`,
      [
        setting.WrongAnswerPunishment,
        setting.Notification ? 1 : 0,
        setting.NotificationHour,
        setting.NotificationMinute,
        setting.IsShowTranslationControl ? 1 : 0,
        setting.DefaultTranslationTarget,
      ],
    );
  }

  async getOrCreateDefaults(): Promise<Setting> {
    const existing = await this.get();
    if (existing) {
      return {
        ...existing,
        Notification: !!existing.Notification,
      };
    }

    return {
      WrongAnswerPunishment: "None",
      Notification: false,
      NotificationHour: 18,
      NotificationMinute: null,
      IsShowTranslationControl: false,
      DefaultTranslationTarget: "fa",
    };
  }
}

export const settingRepository: ISettingRepository = new SettingRepository();
