import { db } from "../../../db/connection";
import type { CustomPrompt } from "../../../shared/types/entities";


export class CustomPromptRepository {
  async getAll(): Promise<CustomPrompt[]> {
    const result = await db.query("SELECT * FROM CustomPrompts;");
    return (result.values ?? []) as CustomPrompt[];
  }

  async getById(id: string): Promise<CustomPrompt | null> {
    const result = await db.query("SELECT * FROM CustomPrompts WHERE Id = ?;", [
      id,
    ]);
    const rows = result.values ?? [];
    return rows.length > 0 ? (rows[0] as CustomPrompt) : null;
  }

  async create(prompt: CustomPrompt): Promise<void> {
    await db.run(
      `INSERT INTO CustomPrompts (Id, Name, Prompt)
       VALUES (?, ?, ?);`,
      [prompt.Id, prompt.Name, prompt.Prompt],
    );
  }

  async update(prompt: CustomPrompt): Promise<void> {
    await db.run(
      `UPDATE CustomPrompts
       SET Name = ?, Prompt = ?
       WHERE Id = ?;`,
      [prompt.Name, prompt.Prompt, prompt.Id],
    );
  }

  async delete(id: string): Promise<void> {
    await db.run("DELETE FROM CustomPrompts WHERE Id = ?;", [id]);
  }
}
