import type { Theme } from "../db/entities.ts";

export interface IThemeRepository {
  get(): Promise<Theme | null>;
  upsert(theme: Omit<Theme, "Id">): Promise<void>;
  getOrCreateDefaults(): Promise<Theme>;
}
