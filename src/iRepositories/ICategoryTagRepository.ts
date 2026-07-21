import type { CategoryTag } from "../db/entities.ts";
import type { NewTopicTagsDto } from "../dtos/newTopicTagsDto.ts";
import type { ReviewTagsDto } from "../dtos/reviewTagsDto.ts";
import type { TagProgressDto } from "../dtos/tagProgressDto.ts";

export interface ICategoryTagRepository {
  getAll(): Promise<CategoryTag[]>;
  create(tag: CategoryTag): Promise<void>;
  update(tag: CategoryTag): Promise<void>;
  delete(id: string): Promise<void>;
  deleteCascade(id: string): Promise<void>;
  getReviewTags(): Promise<ReviewTagsDto[]>;
  getNewTopicTags(): Promise<NewTopicTagsDto[]>;
  getTagsProgressWithCardCount(): Promise<TagProgressDto[]>;
}
