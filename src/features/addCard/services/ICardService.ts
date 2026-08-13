import type { QuestionsResponse, GeneratedCardData, GenerateCardRequest, SaveCardRequest, QuestionType } from "../types";
import type { TopicType } from "../topicPrompts";

export interface ICardService {
  generateCard(request: GenerateCardRequest): Promise<GeneratedCardData>;
  generateQuestions(aiModelId: string, card: GeneratedCardData, questionTypes: readonly QuestionType[], topicType: TopicType): Promise<QuestionsResponse>;
  saveCard(request: SaveCardRequest): Promise<string>;
  generateQuestionsAndSave(request: SaveCardRequest, questionTypes: readonly QuestionType[]): Promise<string>;
}
