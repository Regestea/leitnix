import type { Theme } from "../db/entities.ts";

export interface IThemeRepository {
  upsert(theme: Omit<Theme, "Id">): Promise<void>;
  getOrCreateDefaults(): Promise<Theme>;
}
