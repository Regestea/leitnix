import { getDb } from "../../../db/connection.ts";
import type { AiModel } from "../../../shared/types/entities.ts";

export class AiModelRepository {
  async getAll(): Promise<AiModel[]> {
    const db = await getDb();
    const result = await db.query("SELECT * FROM AiModels;");
    return (result.values ?? []) as AiModel[];
  }

  async getById(id: string): Promise<AiModel | null> {
    const db = await getDb();
    const result = await db.query("SELECT * FROM AiModels WHERE Id = ?;", [
      id,
    ]);
    const rows = result.values ?? [];
    return rows.length > 0 ? (rows[0] as AiModel) : null;
  }

  async create(model: AiModel): Promise<void> {
    const db = await getDb();
    await db.run(
      `INSERT INTO AiModels (Id, DisplayName, URL, ModelName, APIKey, Provider)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        model.Id,
        model.DisplayName,
        model.URL,
        model.ModelName,
        model.APIKey,
        model.Provider,
      ]
    );
  }

  async update(model: AiModel): Promise<void> {
    const db = await getDb();
    await db.run(
      `UPDATE AiModels
       SET DisplayName = ?, URL = ?, ModelName = ?, APIKey = ?, Provider = ?
       WHERE Id = ?;`,
      [
        model.DisplayName,
        model.URL,
        model.ModelName,
        model.APIKey,
        model.Provider,
        model.Id,
      ]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.run("DELETE FROM AiModels WHERE Id = ?;", [id]);
  }
}
