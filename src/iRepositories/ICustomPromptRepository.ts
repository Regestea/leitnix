import type { CustomPrompt } from "../db/entities.ts";

export interface ICustomPromptRepository {
  getAll(): Promise<CustomPrompt[]>;
  getById(id: string): Promise<CustomPrompt | null>;
  create(prompt: CustomPrompt): Promise<void>;
  update(prompt: CustomPrompt): Promise<void>;
  delete(id: string): Promise<void>;
}
