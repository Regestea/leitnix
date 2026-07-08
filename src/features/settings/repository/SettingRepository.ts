import { getDb } from "../../../db/connection";
import type { Setting } from "../../../shared/types/entities";

export class SettingRepository {
  async get(): Promise<Setting | null> {
    const db = await getDb();
    const result = await db.query("SELECT * FROM Setting LIMIT 1;");
    const rows = result.values ?? [];
    return rows.length > 0 ? (rows[0] as Setting) : null;
  }

  async upsert(setting: Setting): Promise<void> {
    const db = await getDb();
    await db.run(
      `INSERT INTO Setting (Id, WrongAnswerPunishment) VALUES (?, ?)
       ON CONFLICT(Id) DO UPDATE SET WrongAnswerPunishment = ?;`,
      [setting.Id, setting.WrongAnswerPunishment, setting.WrongAnswerPunishment]
    );
  }
}
