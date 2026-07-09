import type { Setting } from "../shared/types/entities.ts";

export interface ISettingRepository {
  get(): Promise<Setting | null>;
  upsert(setting: Setting): Promise<void>;
}
