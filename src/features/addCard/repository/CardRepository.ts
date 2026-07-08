import { getDb } from "../../../db/connection";
import type { Card } from "../../../shared/types/entities";

export class CardRepository {
  async create(card: Card): Promise<void> {
    const db = await getDb();
    await db.run(
      `INSERT INTO Cards (Id, BoxId, CategoryTagId, MarkdownTopic, MarkdownContent, LastReviewUnixTime, NextReviewUnixTime, StartedLearningUnixTime)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        card.Id,
        card.BoxId,
        card.CategoryTagId,
        card.MarkdownTopic,
        card.MarkdownContent,
        card.LastReviewUnixTime,
        card.NextReviewUnixTime,
        card.StartedLearningUnixTime,
      ]
    );
  }

  async getByCategoryTagId(tagId: string): Promise<Card[]> {
    const db = await getDb();
    const result = await db.query(
      "SELECT * FROM Cards WHERE CategoryTagId = ?;",
      [tagId]
    );
    return (result.values ?? []) as Card[];
  }

  async updateCategoryTagId(
    cardIds: string[],
    newTagId: string
  ): Promise<void> {
    const db = await getDb();
    const placeholders = cardIds.map(() => "?").join(", ");
    await db.run(
      `UPDATE Cards SET CategoryTagId = ? WHERE Id IN (${placeholders});`,
      [newTagId, ...cardIds]
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

  async getById(id: string): Promise<Card | null> {
    const db = await getDb();
    const result = await db.query("SELECT * FROM Cards WHERE Id = ?;", [id]);
    const rows = result.values ?? [];
    return rows.length > 0 ? (rows[0] as Card) : null;
  }

  async getPendingByTag(tagId: string): Promise<Card[]> {
    const db = await getDb();
    const result = await db.query(
      "SELECT * FROM Cards WHERE CategoryTagId = ? AND BoxId IS NULL;",
      [tagId]
    );
    return (result.values ?? []) as Card[];
  }

  async getTagPendingCounts(): Promise<Map<string, number>> {
    const db = await getDb();
    const result = await db.query(
      "SELECT CategoryTagId, COUNT(*) as Count FROM Cards WHERE BoxId IS NULL AND CategoryTagId IS NOT NULL GROUP BY CategoryTagId;"
    );
    const map = new Map<string, number>();
    for (const row of result.values ?? []) {
      const r = row as { CategoryTagId: string; Count: number };
      map.set(r.CategoryTagId, r.Count);
    }
    return map;
  }

  async startLearning(
    cardId: string,
    box1Id: string,
    now: number,
    intervalMinutes: number
  ): Promise<void> {
    const db = await getDb();
    await db.run(
      `UPDATE Cards
       SET BoxId = ?,
           StartedLearningUnixTime = ?,
           LastReviewUnixTime = ?,
           NextReviewUnixTime = ?
       WHERE Id = ?;`,
      [box1Id, now, now, now + intervalMinutes * 60, cardId]
    );
  }

  async markAsKnown(
    cardId: string,
    finishBoxId: string,
    now: number
  ): Promise<void> {
    const db = await getDb();
    await db.run(
      `UPDATE Cards
       SET BoxId = ?,
           StartedLearningUnixTime = ?,
           LastReviewUnixTime = ?,
           NextReviewUnixTime = NULL
       WHERE Id = ?;`,
      [finishBoxId, now, now, cardId]
    );
  }

  async countStartedLearningLast24h(now: number): Promise<number> {
    const db = await getDb();
    const result = await db.query(
      "SELECT COUNT(*) as Count FROM Cards WHERE StartedLearningUnixTime IS NOT NULL AND StartedLearningUnixTime >= ?;",
      [now - 86400]
    );
    const rows = result.values ?? [];
    return rows.length > 0 ? (rows[0] as { Count: number }).Count : 0;
  }
}
