import type { Setting } from "../db/entities.ts";

export interface ISettingRepository {
  get(): Promise<Setting | null>;
}
