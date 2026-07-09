import type { Theme } from "../shared/types/entities.ts";

export interface IThemeRepository {
  get(): Promise<Theme | null>;
  upsert(theme: Omit<Theme, "Id">): Promise<void>;
  getOrCreateDefaults(): Promise<Theme>;
}
