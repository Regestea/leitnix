import type { CategoryTag } from "../db/entities.ts";

export interface ICategoryTagRepository {
  getAll(): Promise<CategoryTag[]>;
  create(tag: CategoryTag): Promise<void>;
  update(tag: CategoryTag): Promise<void>;
  delete(id: string): Promise<void>;
}
