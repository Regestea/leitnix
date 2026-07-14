import { getDb } from "../db/connection";
import type { CategoryTag } from "../db/entities.ts";
import type { NewTopicTagsDto } from "../dtos/newTopicTagsDto.tsx";
import type { ReviewTagsDto } from "../dtos/reviewTagsDto.ts";
import { unixTimeNow } from "../extensions/timeExtension.ts";
import type { ICategoryTagRepository } from "../iRepositories/ICategoryTagRepository.ts";

export class CategoryTagRepository implements ICategoryTagRepository {
  async getNewTopicTags(): Promise<NewTopicTagsDto[]> {
    const db = await getDb();

    const result = await db.query(
      `
      SELECT ct.*, COUNT(c.Id) AS count
      FROM CategoryTags ct
      JOIN Cards c ON c.CategoryTagId = ct.Id
      WHERE c.BoxId IS NULL
      GROUP BY ct.Id, ct.Name;
      `
    );

    return (result.values ?? []) as NewTopicTagsDto[];
  }
async getReviewTags(): Promise<ReviewTagsDto[]> {
  const db = await getDb();

  const result = await db.query(
    `
    SELECT ct.*, COUNT(c.Id) AS count
    FROM CategoryTags ct
    JOIN Cards c ON c.CategoryTagId = ct.Id
    WHERE c.NextReviewUnixTime IS NOT NULL
      AND c.NextReviewUnixTime <= ?
    GROUP BY ct.Id, ct.Name;
    `,
    [unixTimeNow()]
  );

  return (result.values ?? []) as ReviewTagsDto[];
}
  async getAll(): Promise<CategoryTag[]> {
    const db = await getDb();
    const result = await db.query("SELECT * FROM CategoryTags;");
    return (result.values ?? []) as CategoryTag[];
  }

  async create(tag: CategoryTag): Promise<void> {
    const db = await getDb();
    await db.run(`INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);`, [
      tag.Id,
      tag.Name,
    ]);
  }

  async update(tag: CategoryTag): Promise<void> {
    const db = await getDb();
    await db.run(`UPDATE CategoryTags SET Name = ? WHERE Id = ?;`, [
      tag.Name,
      tag.Id,
    ]);
  }

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.run("DELETE FROM CategoryTags WHERE Id = ?;", [id]);
  }
}

export const categoryTagRepository: ICategoryTagRepository =
  new CategoryTagRepository();
