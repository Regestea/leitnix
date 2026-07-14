import type { CategoryTag } from "../db/entities.ts";
import type { ReviewTagsDto } from "../dtos/reviewTagsDto.ts";



export interface ICategoryTagRepository {
  getAll(): Promise<CategoryTag[]>;
  create(tag: CategoryTag): Promise<void>;
  update(tag: CategoryTag): Promise<void>;
  delete(id: string): Promise<void>;
  getReviewTags(): Promise<ReviewTagsDto[]>;
}
