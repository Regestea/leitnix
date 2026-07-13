import { getDb } from "../db/connection";
import type { CategoryTag } from "../db/entities.ts";
import { unixTimeNow } from "../extensions/timeExtension.ts";
import type { ICategoryTagRepository } from "../iRepositories/ICategoryTagRepository.ts";

export class CategoryTagRepository implements ICategoryTagRepository {
async getReviewTags(): Promise<CategoryTag[]> {
  const db = await getDb();

  const result = await db.query(
    `
    SELECT DISTINCT ct.*
    FROM CategoryTags ct
    JOIN Cards c ON c.CategoryTagId = ct.Id
    WHERE c.NextReviewUnixTime IS NOT NULL
      AND c.NextReviewUnixTime <= ?;
    `,
    [unixTimeNow()]
  );

  return (result.values ?? []) as CategoryTag[];
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
