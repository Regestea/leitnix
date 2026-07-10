import type { Box } from "../db/entities.ts";

export interface IBoxRepository {
  getById(id: string): Promise<Box | null>;
  getFirst(): Promise<Box | null>;
  getFinish(): Promise<Box | null>;
  getChainOrdered(): Promise<Box[]>;
  create(box: Box): Promise<void>;
  getCardCounts(): Promise<Map<string, number>>;
  update(box: Box): Promise<void>;
  delete(id: string): Promise<void>;
}
