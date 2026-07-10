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

}

export const settingRepository: ISettingRepository = new SettingRepository();
