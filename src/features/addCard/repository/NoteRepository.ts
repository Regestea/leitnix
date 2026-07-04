import { getDb } from "../../../db/connection";
import type { Note } from "../../../shared/types/entities";

export class NoteRepository {
  async createMany(notes: Note[]): Promise<void> {
    const db = await getDb();
    for (const note of notes) {
      await db.run(
        `INSERT INTO Notes (Id, CardId, MarkdownContent)
         VALUES (?, ?, ?);`,
        [note.Id, note.CardId, note.MarkdownContent]
      );
    }
  }
}
