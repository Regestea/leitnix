import type { AiModel } from "../shared/types/entities.ts";

export interface IAiModelRepository {
  getAll(): Promise<AiModel[]>;
  getById(id: string): Promise<AiModel | null>;
  create(model: AiModel): Promise<void>;
  update(model: AiModel): Promise<void>;
  delete(id: string): Promise<void>;
}
