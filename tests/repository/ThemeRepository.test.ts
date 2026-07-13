import { describe, it, expect, beforeEach, vi } from "vitest";
import type { MockDb } from "../dbTestHelper";
import { createInMemoryDb } from "../dbTestHelper";

const mockGetDb = vi.fn<() => Promise<MockDb>>();

vi.mock("../../src/db/connection", () => ({
  getDb: () => mockGetDb(),
}));

import { ThemeRepository } from "../../src/repositories/ThemeRepository";

describe("ThemeRepository", () => {
  let db: MockDb;

  beforeEach(() => {
    db = createInMemoryDb();
    mockGetDb.mockResolvedValue(db);
  });

  it("getOrCreateDefaults creates and returns default theme when none exists", async () => {
    const repo = new ThemeRepository();
    const result = await repo.getOrCreateDefaults();

    expect(result.Id).toBe("app-theme");
    expect(result.Theme).toBe("Dark");
    expect(result.FontFamily).toBe("comic");
    expect(result.AndroidNavigation).toBe(true);
  });

  it("getOrCreateDefaults returns existing theme", async () => {
    await db.run(
      `INSERT INTO Theme (Id, FontFamily, FontSize, FontWeight, Theme, AndroidNavigation)
       VALUES (?, ?, ?, ?, ?, ?);`,
      ["app-theme", "serif", "large", "bold", "Light", 0],
    );

    const repo = new ThemeRepository();
    const result = await repo.getOrCreateDefaults();

    expect(result.FontFamily).toBe("serif");
    expect(result.FontSize).toBe("large");
    expect(result.Theme).toBe("Light");
    expect(result.AndroidNavigation).toBe(false);
  });

  it("upsert creates a new theme", async () => {
    const repo = new ThemeRepository();
    await repo.upsert({
      FontFamily: "monospace",
      FontSize: "small",
      FontWeight: "bold",
      Theme: "Dark",
      AndroidNavigation: false,
    });

    const result = await db.query("SELECT * FROM Theme WHERE Id = ?;", ["app-theme"]);
    expect(result.values).toHaveLength(1);
    const row = result.values[0] as Record<string, unknown>;
    expect(row.FontFamily).toBe("monospace");
    expect(row.FontSize).toBe("small");
  });

  it("upsert updates an existing theme", async () => {
    await db.run(
      `INSERT INTO Theme (Id, FontFamily, FontSize, FontWeight, Theme, AndroidNavigation)
       VALUES (?, ?, ?, ?, ?, ?);`,
      ["app-theme", "comic", "medium", "normal", "Dark", 1],
    );

    const repo = new ThemeRepository();
    await repo.upsert({
      FontFamily: "sans-serif",
      FontSize: "large",
      FontWeight: "bold",
      Theme: "Light",
      AndroidNavigation: false,
    });

    const result = await db.query("SELECT * FROM Theme WHERE Id = ?;", ["app-theme"]);
    expect(result.values).toHaveLength(1);
    const row = result.values[0] as Record<string, unknown>;
    expect(row.FontFamily).toBe("sans-serif");
    expect(row.Theme).toBe("Light");
    expect(row.AndroidNavigation).toBe(0);
  });
});
