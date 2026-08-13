import { getDb } from "../db/connection";
import type { CategoryTag } from "../db/entities.ts";
import type { NewTopicTagsDto } from "../dtos/NewTopicTagsDto.ts";
import type { ReviewTagsDto } from "../dtos/ReviewTagsDto.ts";
import type { TagProgressDto } from "../dtos/TagProgressDto.ts";
import { unixTimeNow } from "../extensions/timeExtension.ts";

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

export class CategoryTagRepository implements ICategoryTagRepository {
  async getTagsProgressWithCardCount(): Promise<TagProgressDto[]> {
    const db = await getDb();

    const result = await db.query(
      `
      SELECT 
        ct.Id,
        ct.Name,
        (
          SELECT COUNT(*) FROM Cards c
          WHERE c.CategoryTagId = ct.Id
            AND c.BoxId IN (SELECT Id FROM Boxes WHERE NextBoxId IS NULL)
        ) AS CurrentProgress,
        (SELECT COUNT(*) FROM Cards c WHERE c.CategoryTagId = ct.Id) AS TotalCount
      FROM CategoryTags ct;
      `
    );

    return (result.values ?? []) as TagProgressDto[];
  }
  async getNewTopicTags(): Promise<NewTopicTagsDto[]> {
    const db = await getDb();

    const result = await db.query(
      `
      SELECT ct.Id AS id, ct.Name AS name, COUNT(c.Id) AS count
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
    SELECT ct.Id AS id, ct.Name AS name, COUNT(c.Id) AS count
    FROM CategoryTags ct
    JOIN Cards c ON c.CategoryTagId = ct.Id
    WHERE c.NextReviewUnixTime IS NOT NULL
      AND c.NextReviewUnixTime <= ?
      AND c.BoxId IS NOT NULL
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

  async deleteCascade(id: string): Promise<void> {
    const db = await getDb();
    await db.run("DELETE FROM Cards WHERE CategoryTagId = ?;", [id]);
    await db.run("DELETE FROM CategoryTags WHERE Id = ?;", [id]);
  }
}

export const categoryTagRepository: ICategoryTagRepository =
  new CategoryTagRepository();
