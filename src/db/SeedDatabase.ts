interface SeedDb {
  execute: (sql: string) => Promise<void>;
}

export class SeedDatabase {
  private db: SeedDb;

  constructor(db: SeedDb) {
    this.db = db;
  }

  async seedEssential(): Promise<void> {
    await this.seedCategoryTags();
    await this.seedSetting();
    await this.seedBoxes();
  }

  async seedDev(): Promise<void> {
    await this.seedAiModels();
  }

  private async seedCategoryTags(): Promise<void> {
    await this.db.execute(
      `INSERT INTO CategoryTags (Id, Name) SELECT '${crypto.randomUUID()}', 'Default' WHERE NOT EXISTS (SELECT 1 FROM CategoryTags);`,
    );
  }

  private async seedSetting(): Promise<void> {
    await this.db.execute(
      `INSERT OR IGNORE INTO Setting (Id, WrongAnswerPunishment) VALUES ('default-setting', 'None');`,
    );
  }

  private async seedBoxes(): Promise<void> {
    const box1Id = crypto.randomUUID();
    const box2Id = crypto.randomUUID();
    const box3Id = crypto.randomUUID();
    const box4Id = crypto.randomUUID();
    const box5Id = crypto.randomUUID();
    const box6Id = crypto.randomUUID();
    const box7Id = crypto.randomUUID();
    const finishId = crypto.randomUUID();

    await this.db.execute(`
      INSERT OR IGNORE INTO Boxes (Id, Name, RepeatIntervalSeconds, NextBoxId, PreviousBoxId) VALUES
        ('${box1Id}', 'box1', 1440, '${box2Id}', NULL),
        ('${box2Id}', 'box2', 2880, '${box3Id}', '${box1Id}'),
        ('${box3Id}', 'box3', 5760, '${box4Id}', '${box2Id}'),
        ('${box4Id}', 'box4', 10080, '${box5Id}', '${box3Id}'),
        ('${box5Id}', 'box5', 20160, '${box6Id}', '${box4Id}'),
        ('${box6Id}', 'box6', 43200, '${box7Id}', '${box5Id}'),
        ('${box7Id}', 'box7', 86400, '${finishId}', '${box6Id}'),
        ('${finishId}', 'finish', 0, NULL, '${box7Id}');
    `);
  }

  private async seedAiModels(): Promise<void> {
    const displayName = import.meta.env.VITE_AI_DISPLAY_NAME || "Dev AI Model Gemini";
    const url = import.meta.env.VITE_AI_URL || "";
    const modelName = import.meta.env.VITE_AI_MODEL_NAME || "";
    const apiKey = import.meta.env.VITE_AI_API_KEY || "";
    const provider = import.meta.env.VITE_AI_PROVIDER || "";

    await this.db.execute(
      `INSERT OR IGNORE INTO AiModels (Id, DisplayName, URL, ModelName, APIKey, Provider) VALUES
        ('DefaultAiModelId', '${displayName}', '${url}', '${modelName}', '${apiKey}', '${provider}');`,
    );
  }
}
