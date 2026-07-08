import { getDb } from "../../../db/connection.ts";
import type { Box } from "../../../shared/types/entities";

export class BoxRepository {
  async getAll(): Promise<Box[]> {
    const db = await getDb();
    const result = await db.query("SELECT * FROM Boxes;");
    return (result.values ?? []) as Box[];
  }

  async getById(id: string): Promise<Box | null> {
    const db = await getDb();
    const result = await db.query("SELECT * FROM Boxes WHERE Id = ?;", [id]);
    const rows = result.values ?? [];
    return rows.length > 0 ? (rows[0] as Box) : null;
  }

  async getFirst(): Promise<Box | null> {
    const db = await getDb();
    const result = await db.query(
      "SELECT * FROM Boxes WHERE PreviousBoxId IS NULL LIMIT 1;",
    );
    const rows = result.values ?? [];
    return rows.length > 0 ? (rows[0] as Box) : null;
  }

  async getChainOrdered(): Promise<Box[]> {
    const allBoxes = await this.getAll();
    const boxMap = new Map<string, Box>();
    for (const box of allBoxes) {
      boxMap.set(box.Id, box);
    }

    let head: Box | null = null;
    for (const box of allBoxes) {
      if (box.PreviousBoxId === null) {
        head = box;
        break;
      }
    }

    if (!head) return [];

    const ordered: Box[] = [];
    let current: Box | null = head;
    const visited = new Set<string>();

    while (current && !visited.has(current.Id)) {
      visited.add(current.Id);
      ordered.push(current);
      current = current.NextBoxId ? boxMap.get(current.NextBoxId) ?? null : null;
    }

    return ordered;
  }

  async create(box: Box): Promise<void> {
    const db = await getDb();
    const ordered = await this.getChainOrdered();

    const finishBox =
      ordered.length > 0 && ordered[ordered.length - 1].RepeatIntervalSeconds === 0
        ? ordered[ordered.length - 1]
        : null;

    const previousBox = finishBox
      ? ordered[ordered.length - 2] ?? null
      : ordered.length > 0
        ? ordered[ordered.length - 1]
        : null;

    const nextBoxId = finishBox ? finishBox.Id : null;

    await db.run(
      `INSERT INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId)
       VALUES (?, ?, ?, ?, ?);`,
      [box.Id, box.Name, box.RepeatIntervalSeconds, nextBoxId, null],
    );

    if (previousBox) {
      await db.run("UPDATE Boxes SET NextBoxId = ? WHERE Id = ?;", [
        box.Id,
        previousBox.Id,
      ]);
    }

    await db.run("UPDATE Boxes SET PreviousBoxId = ? WHERE Id = ?;", [
      previousBox?.Id ?? null,
      box.Id,
    ]);
  }

  async getCardCounts(): Promise<Map<string, number>> {
    const db = await getDb();
    const result = await db.query(
      "SELECT BoxId, COUNT(*) as Count FROM Cards GROUP BY BoxId;",
    );
    const map = new Map<string, number>();
    for (const row of result.values ?? []) {
      map.set((row as { BoxId: string; Count: number }).BoxId, (row as { BoxId: string; Count: number }).Count);
    }
    return map;
  }

  async update(box: Box): Promise<void> {
    const db = await getDb();
    await db.run(
      `UPDATE Boxes
       SET Name = ?, RepeatIntervalSeconds = ?
       WHERE Id = ?;`,
      [box.Name, box.RepeatIntervalSeconds, box.Id],
    );

    // Recalculate NextReviewUnixTime for all cards in this box
    const repeatSeconds = box.RepeatIntervalSeconds ?? 0;
    const cardsResult = await db.query(
      "SELECT Id, LastReviewUnixTime FROM Cards WHERE BoxId = ? AND LastReviewUnixTime IS NOT NULL;",
      [box.Id],
    );
    for (const card of cardsResult.values ?? []) {
      const c = card as { Id: string; LastReviewUnixTime: number };
      await db.run(
        "UPDATE Cards SET NextReviewUnixTime = ? WHERE Id = ?;",
        [c.LastReviewUnixTime + repeatSeconds, c.Id],
      );
    }
  }

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const box = await this.getById(id);
    if (!box) return;

    // Move cards to the previous box (or first box if no previous)
    const destinationBoxId = box.PreviousBoxId
      ? box.PreviousBoxId
      : (await this.getFirst())?.Id ?? null;

    if (destinationBoxId) {
      // Get destination box's repeat interval
      const destBox = await this.getById(destinationBoxId);
      const repeatSeconds = destBox?.RepeatIntervalSeconds ?? 0;

      // Move cards and recalculate their NextReviewUnixTime
      const cardsResult = await db.query(
        "SELECT Id, LastReviewUnixTime FROM Cards WHERE BoxId = ? AND LastReviewUnixTime IS NOT NULL;",
        [id],
      );
      for (const card of cardsResult.values ?? []) {
        const c = card as { Id: string; LastReviewUnixTime: number };
        await db.run(
          "UPDATE Cards SET BoxId = ?, NextReviewUnixTime = ? WHERE Id = ?;",
          [destinationBoxId, c.LastReviewUnixTime + repeatSeconds, c.Id],
        );
      }

      // Move cards that have no LastReviewUnixTime
      await db.run("UPDATE Cards SET BoxId = ? WHERE BoxId = ? AND LastReviewUnixTime IS NULL;", [
        destinationBoxId, id,
      ]);
    }

    // Re-link neighbors
    if (box.PreviousBoxId) {
      await db.run("UPDATE Boxes SET NextBoxId = ? WHERE Id = ?;", [
        box.NextBoxId,
        box.PreviousBoxId,
      ]);
    }

    if (box.NextBoxId) {
      await db.run("UPDATE Boxes SET PreviousBoxId = ? WHERE Id = ?;", [
        box.PreviousBoxId,
        box.NextBoxId,
      ]);
    }

    await db.run("DELETE FROM Boxes WHERE Id = ?;", [id]);
  }
}
