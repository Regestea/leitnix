export interface IReviewService {
  startLearning(cardId: string): Promise<void>;
  markAsKnown(cardId: string): Promise<void>;
  recordReview(cardId: string, correct: boolean): Promise<void>;
}
