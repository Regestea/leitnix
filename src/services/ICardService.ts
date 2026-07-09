import type { QuestionsResponse, GeneratedCardData, GenerateCardRequest, SaveCardRequest } from "../features/addCard/types";

export interface ICardService {
  generateCard(request: GenerateCardRequest): Promise<GeneratedCardData>;
  generateQuestions(aiModelId: string, card: GeneratedCardData): Promise<QuestionsResponse>;
  saveCard(request: SaveCardRequest): Promise<string>;
  generateQuestionsAndSave(request: SaveCardRequest): Promise<string>;
}
