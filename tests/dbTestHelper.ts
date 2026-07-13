import Database from "better-sqlite3";
import { CREATE_TABLE_STATEMENTS } from "../src/db/schema";

export interface MockDb {
  query: (sql: string, params?: unknown[]) => Promise<{ values: unknown[] }>;
  run: (sql: string, params?: unknown[]) => Promise<{ changes: number }>;
}

export function createInMemoryDb(): MockDb {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");

  for (const stmt of CREATE_TABLE_STATEMENTS) {
    db.exec(stmt);
  }

  return {
    query: async (sql: string, params?: unknown[]) => {
      if (params && params.length > 0) {
        const values = db.prepare(sql).all(...params);
        return { values };
      }
      const values = db.prepare(sql).all();
      return { values };
    },
    run: async (sql: string, params?: unknown[]) => {
      if (params && params.length > 0) {
        db.prepare(sql).run(...params);
      } else {
        db.exec(sql);
      }
      return { changes: 0 };
    },
  };
}
