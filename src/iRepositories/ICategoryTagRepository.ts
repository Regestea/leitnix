import type { CategoryTag } from "../shared/types/entities.ts";

export interface ICategoryTagRepository {
  getAll(): Promise<CategoryTag[]>;
  getById(id: string): Promise<CategoryTag | null>;
  create(tag: CategoryTag): Promise<void>;
  update(tag: CategoryTag): Promise<void>;
  delete(id: string): Promise<void>;
}
