import type { Card } from "../db/entities.ts";
import type { CardPreviewDto } from "../dtos/cardPreviewDto.ts";

export interface ICardRepository {
  getAllPreview(currentPage:number,pageSize:number,tagId?:string,boxId?:string):Promise<CardPreviewDto[]>
  getById(id: string): Promise<Card | null>;
  create(card: Card): Promise<void>;
  update(card: Card): Promise<void>;
  delete(id: string): Promise<void>;
  resetBox(cardId: string): Promise<void>;
  getByCategoryTagId(tagId: string): Promise<Card[]>;
  updateCategoryTagId(cardIds: string[], newTagId: string): Promise<void>;
  countStartedLearningLast24h(): Promise<number>;
  overallReviewToday(): Promise<number>;
  getCardNeedToReview(tagId: string): Promise<Card | null>;
  getCardNewTopic(tagId: string): Promise<Card | null>;
  startLearning(cardId: string): Promise<void>;
  markAsKnown(cardId: string): Promise<void>;
  overallReviewToday():Promise<number>;
}
