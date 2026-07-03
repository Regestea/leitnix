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

  await db.execute(`CREATE TABLE IF NOT EXISTS Theme (
      Id TEXT PRIMARY KEY,
      FontFamily TEXT,
      FontSize   TEXT,
      FontWeight TEXT,
      Theme      TEXT,
      AndroidNavigation BOOLEAN
  );`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS AiModels (
      Id TEXT PRIMARY KEY,
      DisplayName TEXT,
      URL   TEXT,
      ModelName TEXT,
      APIKey TEXT,
      Provider TEXT CHECK (Provider IN ('GoogleGemini', 'OpenRouter', 'AvalAi','OpenAi','OpenAiCompatible'))
    );
  `);

  await db.execute(`CREATE TABLE IF NOT EXISTS CategoryTags (
      Id TEXT PRIMARY KEY,
      Name TEXT
    );
  `);

  await db.execute(`CREATE TABLE IF NOT EXISTS CustomPrompts (
      Id TEXT PRIMARY KEY,
      Name TEXT,
      Prompt TEXT
    );
  `);

  await db.execute(
    `INSERT OR IGNORE INTO CategoryTags (Id, Name) VALUES ('${crypto.randomUUID()}', 'Default');`,
  );

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Boxes (
      Id            TEXT PRIMARY KEY,
      Name          TEXT,
      RepeatPeriodUnixTime  INTEGER,
      NextBoxId     TEXT,
      PreviousBoxId TEXT
    );
  `);

  await db.execute(`
    INSERT OR IGNORE INTO Boxes (Id, Name, RepeatPeriodUnixTime) VALUES
      ('${crypto.randomUUID()}', 'box1', 1440), -- 1 day = 1440 minutes
      ('${crypto.randomUUID()}', 'box2', 2880), -- 2 days = 2880 minutes
      ('${crypto.randomUUID()}', 'box3', 5760), -- 4 days = 5760 minutes
      ('${crypto.randomUUID()}', 'box4', 10080), -- 7 days = 10080 minutes
      ('${crypto.randomUUID()}', 'box5', 20160), -- 14 days = 20160 minutes
      ('${crypto.randomUUID()}', 'box6', 43200), -- 30 days = 43200 minutes
      ('${crypto.randomUUID()}', 'box7', 86400), -- 60 days = 86400 minutes
      ('${crypto.randomUUID()}', 'finish', 0);
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Cards (
      Id    TEXT PRIMARY KEY,
      BoxId           TEXT NOT NULL,
      CategoryTagId    TEXT,
      MarkdownTopic TEXT,
      LastReviewUnixTime      INTEGER,
      NextReviewUnixTime      INTEGER,
      StartedLearningUnixTime   INTEGER,
      FOREIGN KEY (BoxId) REFERENCES Boxes(Id) ON DELETE CASCADE,
      FOREIGN KEY (CategoryTagId) REFERENCES CategoryTags(Id) ON DELETE SET NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Notes (
      Id              TEXT PRIMARY KEY,
      CardId          TEXT NOT NULL,
      MarkdownContent TEXT,
      FOREIGN KEY (CardId) REFERENCES Cards(Id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS FreeResponseQuestions (
      Id TEXT PRIMARY KEY,
      CardId   TEXT NOT NULL,
      MarkdownQuestion TEXT,
      MarkdownAnswer   TEXT,
      FOREIGN KEY (CardId) REFERENCES Cards(Id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS FillTheBlankQuestions (
      Id TEXT PRIMARY KEY,
      CardId   TEXT NOT NULL,
      MarkdownQuestion TEXT,
      MarkdownAnswer   TEXT,
      FOREIGN KEY (CardId) REFERENCES Cards(Id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS MultipleChoiceQuestions (
      Id            TEXT PRIMARY KEY,
      CardId        TEXT NOT NULL,
      MarkdownQuestion      TEXT,
      MarkdownOptionA       TEXT,
      MarkdownOptionB       TEXT,
      MarkdownOptionC       TEXT,
      MarkdownOptionD       TEXT,
      CorrectOption TEXT CHECK (CorrectOption IN ('A', 'B', 'C', 'D')),
      FOREIGN KEY (CardId) REFERENCES Cards(Id) ON DELETE CASCADE
    );
  `);
}

export { db };