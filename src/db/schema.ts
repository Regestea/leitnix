export const CREATE_TABLE_STATEMENTS = [
  `
    CREATE TABLE IF NOT EXISTS Setting (
      WrongAnswerPunishment TEXT NOT NULL DEFAULT 'None'
      CHECK (
        WrongAnswerPunishment IN (
          'None',
          'JumpOneBoxBack',
          'JumpToFirstBox'
        )
      ),
      ReadAloudBadge BOOLEAN DEFAULT FALSE,
      Notification BOOLEAN DEFAULT FALSE,
      NotificationHour INTEGER DEFAULT NULL
        CHECK (
          NotificationHour IS NULL OR (NotificationHour >= 0 AND NotificationHour <= 23)
        ),
      NotificationMinute INTEGER DEFAULT NULL
        CHECK (
          NotificationMinute IS NULL OR (NotificationMinute >= 0 AND NotificationMinute <= 59)
        ),
      IsShowTranslationControl BOOLEAN DEFAULT FALSE,
      DefaultTranslationTarget TEXT DEFAULT 'fa'
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS Theme (
      Id TEXT PRIMARY KEY,
      FontFamily TEXT,
      FontSize TEXT,
      FontWeight TEXT,
      Theme TEXT,
      AndroidNavigation BOOLEAN
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS AiModels (
      Id TEXT PRIMARY KEY,
      DisplayName TEXT,
      URL TEXT,
      ModelName TEXT,
      APIKey TEXT,
      Provider TEXT CHECK (
        Provider IN (
          'GoogleGemini',
          'OpenRouter',
          'AvalAi',
          'OpenAi',
          'OpenAiCompatible'
        )
      )
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS CategoryTags (
      Id TEXT PRIMARY KEY,
      Name TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS CustomPrompts (
      Id TEXT PRIMARY KEY,
      Name TEXT NOT NULL,
      Prompt TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS Boxes (
      Id TEXT PRIMARY KEY,
      Name TEXT NOT NULL,
      RepeatIntervalSeconds INTEGER NOT NULL
        CHECK (RepeatIntervalSeconds >= 0),
      NextBoxId TEXT,
      PreviousBoxId TEXT,
      FOREIGN KEY (NextBoxId) REFERENCES Boxes(Id),
      FOREIGN KEY (PreviousBoxId) REFERENCES Boxes(Id)
);
  `,
  `
    CREATE TABLE IF NOT EXISTS Cards (
      Id TEXT PRIMARY KEY,
      BoxId TEXT,
      CategoryTagId TEXT,
      MarkdownTopic TEXT NOT NULL,
      MarkdownContent TEXT NOT NULL,
      LastReviewUnixTime INTEGER
        CHECK (LastReviewUnixTime IS NULL OR LastReviewUnixTime >= 0),
      NextReviewUnixTime INTEGER
        CHECK (NextReviewUnixTime IS NULL OR NextReviewUnixTime >= 0),
      StartedLearningUnixTime INTEGER
        CHECK (StartedLearningUnixTime IS NULL OR StartedLearningUnixTime >= 0),
      FOREIGN KEY (BoxId) REFERENCES Boxes(Id) ON DELETE CASCADE,
      FOREIGN KEY (CategoryTagId) REFERENCES CategoryTags(Id) ON DELETE SET NULL
);
  `,
  `
    CREATE TABLE IF NOT EXISTS FreeResponseQuestions (
      Id TEXT PRIMARY KEY,
      CardId TEXT NOT NULL,
      MarkdownQuestion TEXT NOT NULL,
      MarkdownAnswer TEXT NOT NULL,
      AskedTimes INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (CardId) REFERENCES Cards(Id) ON DELETE CASCADE
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS FillTheBlankQuestions (
      Id TEXT PRIMARY KEY,
      CardId TEXT NOT NULL,
      MarkdownQuestion TEXT NOT NULL,
      MarkdownAnswer TEXT NOT NULL,
      AskedTimes INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (CardId) REFERENCES Cards(Id) ON DELETE CASCADE
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS MultipleChoiceQuestions (
      Id TEXT PRIMARY KEY,
      CardId TEXT NOT NULL,
      MarkdownQuestion TEXT NOT NULL,
      MarkdownOptionA TEXT NOT NULL,
      MarkdownOptionB TEXT NOT NULL,
      MarkdownOptionC TEXT NOT NULL,
      MarkdownOptionD TEXT NOT NULL,
      CorrectOption TEXT NOT NULL
      CHECK (CorrectOption IN ('A', 'B', 'C', 'D')),
      AskedTimes INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (CardId) REFERENCES Cards(Id) ON DELETE CASCADE
    );
  `,
];
