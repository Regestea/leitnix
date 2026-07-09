import { getDb } from "../db/connection";
import type { CategoryTag } from "../shared/types/entities";
import type { ICategoryTagRepository } from "../iRepositories/ICategoryTagRepository.ts";

export class CategoryTagRepository implements ICategoryTagRepository {
  async getAll(): Promise<CategoryTag[]> {
    const db = await getDb();
    const result = await db.query("SELECT * FROM CategoryTags;");
    return (result.values ?? []) as CategoryTag[];
  }

  async getById(id: string): Promise<CategoryTag | null> {
    const db = await getDb();
    const result = await db.query("SELECT * FROM CategoryTags WHERE Id = ?;", [
      id,
    ]);
    const rows = result.values ?? [];
    return rows.length > 0 ? (rows[0] as CategoryTag) : null;
  }

  async create(tag: CategoryTag): Promise<void> {
    const db = await getDb();
    await db.run(
      `INSERT INTO CategoryTags (Id, Name) VALUES (?, ?);`,
      [tag.Id, tag.Name]
    );
  }

  async update(tag: CategoryTag): Promise<void> {
    const db = await getDb();
    await db.run(
      `UPDATE CategoryTags SET Name = ? WHERE Id = ?;`,
      [tag.Name, tag.Id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.run("DELETE FROM CategoryTags WHERE Id = ?;", [id]);
  }
}

export const categoryTagRepository: ICategoryTagRepository = new CategoryTagRepository();
