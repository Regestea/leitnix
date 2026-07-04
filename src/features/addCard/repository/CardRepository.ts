import { getDb } from "../../../db/connection";
import type { Card } from "../../../shared/types/entities";

export class CardRepository {
  async create(card: Card): Promise<void> {
    const db = await getDb();
    await db.run(
      `INSERT INTO Cards (Id, BoxId, CategoryTagId, MarkdownTopic, LastReviewUnixTime, NextReviewUnixTime, StartedLearningUnixTime)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        card.Id,
        card.BoxId,
        card.CategoryTagId,
        card.MarkdownTopic,
        card.LastReviewUnixTime,
        card.NextReviewUnixTime,
        card.StartedLearningUnixTime,
      ]
    );
  }

  async getFirstBoxId(): Promise<string | null> {
    const db = await getDb();
    const result = await db.query(
      "SELECT Id FROM Boxes WHERE PreviousBoxId IS NULL LIMIT 1;"
    );
    const rows = result.values ?? [];
    return rows.length > 0 ? (rows[0].Id as string) : null;
  }
}
