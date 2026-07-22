import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { CREATE_INDEX_STATEMENTS, CREATE_TABLE_STATEMENTS } from "./schema.ts";
import { SeedDatabase } from "./SeedDatabase.ts";

const sqlite = new SQLiteConnection(CapacitorSQLite);

let db: SQLiteDBConnection | null = null;
let initPromise: Promise<void> | null = null;

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 300,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(
        `connection.ts: attempt ${attempt + 1}/${retries} failed, retrying in ${delayMs}ms…`,
        error,
      );
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

export async function initializeDatabase(): Promise<void> {
  // Idempotent: if init is already in-flight or completed, reuse the same promise.
  if (initPromise) {
    return initPromise;
  }

  initPromise = withRetry(async () => {
    const consistency = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection("leitnixdb", false)).result;

    if (consistency.result && isConn) {
      db = await sqlite.retrieveConnection("leitnixdb", false);
    } else {
      db = await sqlite.createConnection(
        "leitnixdb",
        false,
        "no-encryption",
        1,
        false,
      );
    }

    await db!.open();

    await db!.execute("PRAGMA foreign_keys = ON;");

    for (const statement of CREATE_TABLE_STATEMENTS) {
      await db!.execute(statement);
    }

    for (const statement of CREATE_INDEX_STATEMENTS) {
      await db!.execute(statement);
    }

    const seeder = new SeedDatabase({
      execute: async (sql: string) => {
        await db!.execute(sql);
      },
    });

    await seeder.seedEssential();

    if (import.meta.env.DEV) {
      await seeder.seedDev();
    }
  });

  // Re-throw so callers still see failures, but the promise stays cached.
  try {
    await initPromise;
  } catch {
    initPromise = null; // allow retry on next call
    throw new Error("Failed to initialize database after retries");
  }
}

export async function getDb(): Promise<SQLiteDBConnection> {
  if (db) return db;
  await initializeDatabase();
  return db!;
}
