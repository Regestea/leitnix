import type { Card } from "../db/entities.ts";

export interface ICardRepository {
  create(card: Card): Promise<void>;
  getByCategoryTagId(tagId: string): Promise<Card[]>;
  updateCategoryTagId(cardIds: string[], newTagId: string): Promise<void>;
  countStartedLearningLast24h(): Promise<number>;
  getCardNeedToReview(tagId: string): Promise<Card | null>;
  getCardNewTopic(tagId: string): Promise<Card | null>;
  startLearning(cardId: string): Promise<void>;
  markAsKnown(cardId: string): Promise<void>;
}
