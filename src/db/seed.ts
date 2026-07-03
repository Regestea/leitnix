export async function seedDefaultData(db: {
  execute: (sql: string) => Promise<void>;
}): Promise<void> {
  await db.execute(
    `INSERT OR IGNORE INTO CategoryTags (Id, Name) VALUES ('${crypto.randomUUID()}', 'Default');`,
  );

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
}
