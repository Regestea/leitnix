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
      WrongAnswerPonishment TEXT NOT NULL DEFAULT 'None' CHECK (WrongAnswerPonishment IN ('None','JumpOneBoxBack', 'JumpToFirstBox'))
    );
  `);

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

  const box1Id = crypto.randomUUID();
  const box2Id = crypto.randomUUID();
  const box3Id = crypto.randomUUID();
  const box4Id = crypto.randomUUID();
  const box5Id = crypto.randomUUID();
  const box6Id = crypto.randomUUID();
  const box7Id = crypto.randomUUID();
  const finishId = crypto.randomUUID();

  await db.execute(`
    INSERT OR IGNORE INTO Boxes (Id, Name, RepeatPeriodUnixTime, NextBoxId, PreviousBoxId) VALUES
      ('${box1Id}', 'box1', 1440, '${box2Id}', NULL),
      ('${box2Id}', 'box2', 2880, '${box3Id}', '${box1Id}'),
      ('${box3Id}', 'box3', 5760, '${box4Id}', '${box2Id}'),
      ('${box4Id}', 'box4', 10080, '${box5Id}', '${box3Id}'),
      ('${box5Id}', 'box5', 20160, '${box6Id}', '${box4Id}'),
      ('${box6Id}', 'box6', 43200, '${box7Id}', '${box5Id}'),
      ('${box7Id}', 'box7', 86400, '${finishId}', '${box6Id}'),
      ('${finishId}', 'finish', 0, NULL, '${box7Id}');
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