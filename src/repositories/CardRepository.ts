import { getDb } from "../db/connection";
import type { Card } from "../db/entities.ts";
import { hoursToSeconds, unixTimeNow } from "../extensions/timeExtension.ts";
import type { ICardRepository } from "../iRepositories/ICardRepository.ts";

export class CardRepository implements ICardRepository {
  async countCardsNeedToReview(tagId: string): Promise<number> {
    const db = await getDb();

    const result = await db.query(
      `
    SELECT COUNT(*) AS Count
    FROM Cards
    WHERE CategoryTagId = ?
      AND NextReviewUnixTime <= ?
      AND NextReviewUnixTime != NULL;
    `,
      [tagId, unixTimeNow()],
    );

    return (result.values?.[0] as { Count: number }).Count;
  }
  async getCardNeedToReview(tagId: string): Promise<Card | null> {
    const db = await getDb();

    const result = await db.query(
      `
    SELECT *
    FROM Cards
    WHERE NextReviewUnixTime <= ?
      AND NextReviewUnixTime IS NOT NULL
      AND BoxId IS NOT NULL
      AND CategoryTagId = ?
    LIMIT 1;
    `,
      [unixTimeNow(), tagId],
    );

    const rows = result.values ?? [];

    return rows.length > 0 ? (rows[0] as Card) : null;
  }

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
      ],
    );
  }

  async getByCategoryTagId(tagId: string): Promise<Card[]> {
    const db = await getDb();
    const result = await db.query(
      "SELECT * FROM Cards WHERE CategoryTagId = ?;",
      [tagId],
    );
    return (result.values ?? []) as Card[];
  }

  async updateCategoryTagId(
    cardIds: string[],
    newTagId: string,
  ): Promise<void> {
    const db = await getDb();
    const placeholders = cardIds.map(() => "?").join(", ");
    await db.run(
      `UPDATE Cards SET CategoryTagId = ? WHERE Id IN (${placeholders});`,
      [newTagId, ...cardIds],
    );
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
      [tagId],
    );
    return (result.values ?? []) as Card[];
  }

  async getTagPendingCounts(): Promise<Map<string, number>> {
    const db = await getDb();
    const result = await db.query(
      "SELECT CategoryTagId, COUNT(*) as Count FROM Cards WHERE BoxId IS NULL AND CategoryTagId IS NOT NULL GROUP BY CategoryTagId;",
    );
    const map = new Map<string, number>();
    for (const row of result.values ?? []) {
      const r = row as { CategoryTagId: string; Count: number };
      map.set(r.CategoryTagId, r.Count);
    }
    return map;
  }

  async startLearning(cardId: string): Promise<void> {
    const db = await getDb();

    const now = unixTimeNow();

    const result = await db.query(
      `
    SELECT Id, RepeatIntervalSeconds
    FROM Boxes
    WHERE PreviousBoxId IS NULL
    LIMIT 1;
    `,
    );

    const firstBox = result.values![0] as {
      Id: string;
      RepeatIntervalSeconds: number;
    };

    await db.run(
      `
    UPDATE Cards
    SET BoxId = ?,
        StartedLearningUnixTime = ?,
        LastReviewUnixTime = ?,
        NextReviewUnixTime = ?
    WHERE Id = ?;
    `,
      [firstBox.Id, now, now + firstBox.RepeatIntervalSeconds, now, cardId],
    );
  }

  async markAsKnown(cardId: string): Promise<void> {
    const db = await getDb();

    const now = unixTimeNow();

    const result = await db.query(
      `
    SELECT Id
    FROM Boxes
    WHERE NextBoxId IS NULL
    LIMIT 1;
    `,
    );

    const finishBox = result.values![0] as {
      Id: string;
    };

    await db.run(
      `
    UPDATE Cards
    SET BoxId = ?,
        StartedLearningUnixTime = ?,
        LastReviewUnixTime = ?,
        NextReviewUnixTime = NULL
    WHERE Id = ?;
    `,
      [finishBox.Id, now, now, cardId],
    );
  }

  async countStartedLearningLast24h(): Promise<number> {
    const db = await getDb();
    const result = await db.query(
      "SELECT COUNT(*) as Count FROM Cards WHERE StartedLearningUnixTime IS NOT NULL AND StartedLearningUnixTime >= ?;",
      [unixTimeNow() - hoursToSeconds(24)],
    );
    const rows = result.values ?? [];
    return rows.length > 0 ? (rows[0] as { Count: number }).Count : 0;
  }
}

export const cardRepository: ICardRepository = new CardRepository();
