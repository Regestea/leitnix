import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";

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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Setting (
      Id TEXT PRIMARY KEY,
      FontFamily TEXT,
      FontSize   TEXT,
      FontWeight TEXT,
      Theme      TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS AiModels (
      Id TEXT PRIMARY KEY,
      DisplayName TEXT,
      URL   TEXT,
      ModelName TEXT,
      APIKey TEXT
    );
  `);

  await db.execute(`CREATE TABLE IF NOT EXISTS CategoryTags (
      Id TEXT PRIMARY KEY,
      Name TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Cards (
      Id    TEXT PRIMARY KEY,
      BoxId           TEXT NOT NULL,
      CategoryTagId    TEXT,
      MarkdownTopic TEXT,
      FOREIGN KEY (BoxId) REFERENCES Boxes(Id) ON DELETE CASCADE,
      FOREIGN KEY (CategoryTagId) REFERENCES CategoryTags(Id) ON DELETE SET NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Boxes (
      Id            TEXT PRIMARY KEY,
      Name        TEXT,
      RepeatPeriodUnixTime  INTEGER,
      NextBoxId     TEXT,
      PreviousBoxId TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Notes (
      Id              TEXT PRIMARY KEY,
      CardId          TEXT NOT NULL,
      NextReviewUnixTime      INTEGER,
      FOREIGN KEY (CardId) REFERENCES Cards(Id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Content(
      Id     TEXT PRIMARY KEY,
      NoteId   TEXT NOT NULL,
      MarkdownContent TEXT,
      FOREIGN KEY (NoteId) REFERENCES Notes(Id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS FreeResponseQuestions (
      Id TEXT PRIMARY KEY,
      NoteId   TEXT NOT NULL,
      MarkdownQuestion TEXT,
      MarkdownAnswer   TEXT,
      FOREIGN KEY (NoteId) REFERENCES Notes(Id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS FillTheBlankQuestions (
      Id TEXT PRIMARY KEY,
      NoteId   TEXT NOT NULL,
      MarkdownQuestion TEXT,
      MarkdownAnswer   TEXT,
      FOREIGN KEY (NoteId) REFERENCES Notes(Id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS MultipleChoiceQuestions (
      Id            TEXT PRIMARY KEY,
      NoteId        TEXT NOT NULL,
      MarkdownQuestion      TEXT,
      MarkdownOptionA       TEXT,
      MarkdownOptionB       TEXT,
      MarkdownOptionC       TEXT,
      MarkdownOptionD       TEXT,
      CorrectOption TEXT CHECK (CorrectOption IN ('A', 'B', 'C', 'D')),
      FOREIGN KEY (NoteId) REFERENCES Notes(Id) ON DELETE CASCADE
    );
  `);
}

export { db };
