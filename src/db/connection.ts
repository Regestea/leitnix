import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { CREATE_TABLE_STATEMENTS } from "./schema.ts";
import { seedDefaultData } from "./seed.ts";

const sqlite = new SQLiteConnection(CapacitorSQLite);

let db: SQLiteDBConnection;

export async function initializeDatabase() {
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

  await db.open();

  await db.execute("PRAGMA foreign_keys = ON;");

  for (const statement of CREATE_TABLE_STATEMENTS) {
    await db.execute(statement);
  }

  const seedDb = {
    execute: async (sql: string) => {
      await db.execute(sql);
    },
  };

  await seedDefaultData(seedDb);

}

export { db };
