import { getDb } from "../db/connection";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import JSZip from "jszip";
import type { BackupTable, BackupOptions, BackupDataPerTable } from "../types/backup.ts";

const DEPENDENCIES: Record<BackupTable, BackupTable[]> = {
  AiModels: [],
  CustomPrompts: [],
  CategoryTags: [],
  Boxes: [],
  Cards: [
    "CategoryTags",
    "FreeResponseQuestions",
    "FillTheBlankQuestions",
    "MultipleChoiceQuestions",
  ],
  FreeResponseQuestions: ["Cards"],
  FillTheBlankQuestions: ["Cards"],
  MultipleChoiceQuestions: ["Cards"],
};

const BACKUP_ORDER: BackupTable[] = [
  "CategoryTags",
  "Boxes",
  "AiModels",
  "CustomPrompts",
  "Cards",
  "FreeResponseQuestions",
  "FillTheBlankQuestions",
  "MultipleChoiceQuestions",
];

const TABLE_COLUMNS: Record<BackupTable, string[]> = {
  AiModels: ["Id", "DisplayName", "URL", "ModelName", "APIKey", "Provider"],
  CustomPrompts: ["Id", "Name", "Prompt"],
  CategoryTags: ["Id", "Name"],
  Boxes: ["Id", "Name", "RepeatIntervalSeconds", "NextBoxId", "PreviousBoxId"],
  Cards: [
    "Id",
    "BoxId",
    "CategoryTagId",
    "MarkdownTopic",
    "MarkdownContent",
    "LastReviewUnixTime",
    "NextReviewUnixTime",
    "StartedLearningUnixTime",
  ],
  FreeResponseQuestions: ["Id", "CardId", "MarkdownQuestion", "MarkdownAnswer", "AskedTimes"],
  FillTheBlankQuestions: ["Id", "CardId", "MarkdownQuestion", "MarkdownAnswer", "AskedTimes"],
  MultipleChoiceQuestions: [
    "Id",
    "CardId",
    "MarkdownQuestion",
    "MarkdownOptionA",
    "MarkdownOptionB",
    "MarkdownOptionC",
    "MarkdownOptionD",
    "CorrectOption",
    "AskedTimes",
  ],
};

export function resolveDependencies(tables: BackupTable[]): BackupTable[] {
  const resolved = new Set<BackupTable>();

  function add(table: BackupTable) {
    if (resolved.has(table)) return;
    resolved.add(table);
    for (const dep of DEPENDENCIES[table]) {
      add(dep);
    }
  }

  for (const table of tables) {
    add(table);
  }

  return BACKUP_ORDER.filter((t) => resolved.has(t));
}

export async function exportTables(options: BackupOptions): Promise<BackupDataPerTable> {
  const db = await getDb();
  const resolved = resolveDependencies(options.tables);
  const tables: BackupDataPerTable = {};

  const hasCardFilter =
    options.categoryTagFilter &&
    options.categoryTagFilter !== "all" &&
    options.categoryTagFilter.length > 0;

  for (const table of resolved) {
    switch (table) {
      case "AiModels": {
        tables.AiModels = ((await db.query("SELECT * FROM AiModels;")).values ?? []);
        break;
      }
      case "CustomPrompts": {
        tables.CustomPrompts = ((await db.query("SELECT * FROM CustomPrompts;")).values ?? []);
        break;
      }
      case "CategoryTags": {
        if (hasCardFilter) {
          const ids = options.categoryTagFilter as string[];
          const placeholders = ids.map(() => "?").join(",");
          tables.CategoryTags = (
            (await db.query(`SELECT * FROM CategoryTags WHERE Id IN (${placeholders});`, ids))
              .values ?? []
          );
        } else {
          tables.CategoryTags = ((await db.query("SELECT * FROM CategoryTags;")).values ?? []);
        }
        break;
      }
      case "Boxes": {
        tables.Boxes = ((await db.query("SELECT * FROM Boxes;")).values ?? []);
        break;
      }
      case "Cards": {
        if (hasCardFilter) {
          const ids = options.categoryTagFilter as string[];
          const placeholders = ids.map(() => "?").join(",");
          tables.Cards = (
            (await db.query(
              `SELECT * FROM Cards WHERE CategoryTagId IN (${placeholders}) OR CategoryTagId IS NULL;`,
              ids,
            )).values ?? []
          );
        } else {
          tables.Cards = ((await db.query("SELECT * FROM Cards;")).values ?? []);
        }
        break;
      }
      case "FreeResponseQuestions": {
        const cardIds = tables.Cards?.map((c) => (c as Record<string, unknown>).Id as string);
        if (cardIds && cardIds.length > 0) {
          const placeholders = cardIds.map(() => "?").join(",");
          tables.FreeResponseQuestions = (
            (await db.query(
              `SELECT * FROM FreeResponseQuestions WHERE CardId IN (${placeholders});`,
              cardIds,
            )).values ?? []
          );
        } else if (!hasCardFilter) {
          tables.FreeResponseQuestions = (
            (await db.query("SELECT * FROM FreeResponseQuestions;")).values ?? []
          );
        }
        break;
      }
      case "FillTheBlankQuestions": {
        const cardIds = tables.Cards?.map((c) => (c as Record<string, unknown>).Id as string);
        if (cardIds && cardIds.length > 0) {
          const placeholders = cardIds.map(() => "?").join(",");
          tables.FillTheBlankQuestions = (
            (await db.query(
              `SELECT * FROM FillTheBlankQuestions WHERE CardId IN (${placeholders});`,
              cardIds,
            )).values ?? []
          );
        } else if (!hasCardFilter) {
          tables.FillTheBlankQuestions = (
            (await db.query("SELECT * FROM FillTheBlankQuestions;")).values ?? []
          );
        }
        break;
      }
      case "MultipleChoiceQuestions": {
        const cardIds = tables.Cards?.map((c) => (c as Record<string, unknown>).Id as string);
        if (cardIds && cardIds.length > 0) {
          const placeholders = cardIds.map(() => "?").join(",");
          tables.MultipleChoiceQuestions = (
            (await db.query(
              `SELECT * FROM MultipleChoiceQuestions WHERE CardId IN (${placeholders});`,
              cardIds,
            )).values ?? []
          );
        } else if (!hasCardFilter) {
          tables.MultipleChoiceQuestions = (
            (await db.query("SELECT * FROM MultipleChoiceQuestions;")).values ?? []
          );
        }
        break;
      }
    }
  }

  return tables;
}

export async function createBackupZip(tables: BackupDataPerTable): Promise<Uint8Array> {
  const zip = new JSZip();

  zip.file(
    "manifest.json",
    JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      tables: Object.keys(tables),
    }),
  );

  for (const [tableName, rows] of Object.entries(tables)) {
    if (rows && rows.length > 0) {
      zip.file(`${tableName}.json`, JSON.stringify(rows, null, 2));
    }
  }

  return await zip.generateAsync({ type: "uint8array" });
}

export async function parseBackupZip(
  data: Blob | Uint8Array,
): Promise<BackupDataPerTable> {
  const zip = await JSZip.loadAsync(data);

  const manifestStr = await zip.file("manifest.json")?.async("string");
  if (!manifestStr) {
    throw new Error("Invalid backup: missing manifest.json");
  }

  const manifest = JSON.parse(manifestStr);
  if (manifest.version !== 1) {
    throw new Error(`Unsupported backup version: ${manifest.version}`);
  }

  const tables: BackupDataPerTable = {};
  for (const tableName of manifest.tables as string[]) {
    const file = zip.file(`${tableName}.json`);
    if (file) {
      const content = await file.async("string");
      tables[tableName as BackupTable] = JSON.parse(content);
    }
  }

  return tables;
}

export async function importBackupZip(tables: BackupDataPerTable): Promise<void> {
  const db = await getDb();

  // Delete existing data from tables being restored, in reverse FK order
  const reverseOrder = [...BACKUP_ORDER].reverse();
  for (const table of reverseOrder) {
    const rows = tables[table];
    if (!rows || rows.length === 0) continue;

    const ids = rows.map((r) => (r as Record<string, unknown>).Id as string).filter(Boolean);
    if (ids.length === 0) continue;

    const placeholders = ids.map(() => "?").join(",");
    if (table === "Boxes") {
      await db.run(`UPDATE Boxes SET NextBoxId=NULL, PreviousBoxId=NULL WHERE Id IN (${placeholders});`, ids);
    }
    await db.run(`DELETE FROM ${table} WHERE Id IN (${placeholders});`, ids);
  }

  // Insert backup data in FK-safe order, one row at a time
  for (const table of BACKUP_ORDER) {
    const rows = tables[table];
    if (!rows || rows.length === 0) continue;

    const columns = TABLE_COLUMNS[table];

    for (const row of rows) {
      let values: (string | number | boolean | null)[];

      if (table === "Boxes") {
        values = columns.map((col) => {
          if (col === "NextBoxId" || col === "PreviousBoxId") return null;
          return (row as Record<string, unknown>)[col] as string | number | boolean | null ?? null;
        });
      } else {
        values = columns.map((col) => {
          return (row as Record<string, unknown>)[col] as string | number | boolean | null ?? null;
        });
      }

      await db.run(
        `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")});`,
        values,
      );
    }
  }

  // Second pass for Boxes: restore self-referential FKs
  const boxRows = tables["Boxes"];
  if (boxRows && boxRows.length > 0) {
    for (const row of boxRows) {
      const r = row as Record<string, unknown>;
      const id = r.Id as string;
      const nextBoxId = r.NextBoxId;
      const prevBoxId = r.PreviousBoxId;
      if (nextBoxId != null || prevBoxId != null) {
        await db.run(
          `UPDATE Boxes SET NextBoxId = ?, PreviousBoxId = ? WHERE Id = ?;`,
          [nextBoxId ?? null, prevBoxId ?? null, id],
        );
      }
    }
  }
}

export async function saveBackupBlob(
  data: Uint8Array,
  suggestedName: string,
): Promise<void> {
  const isCapacitor = Capacitor.isNativePlatform();

  if (isCapacitor) {
    const blob = new Blob([data.buffer as ArrayBuffer], { type: "application/zip" });
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = () => reject(new Error("Failed to read blob"));
      reader.readAsDataURL(blob);
    });

    await Filesystem.writeFile({
      path: suggestedName,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });

    try {
      const { Share } = await import("@capacitor/share");
      const fileUri = await Filesystem.getUri({
        path: suggestedName,
        directory: Directory.Documents,
      });
      await Share.share({
        title: "Backup File",
        text: "Leitnix backup",
        url: fileUri.uri,
        dialogTitle: "Save backup to...",
      });
    } catch {
      // share not critical
    }
    return;
  }

  const blob = new Blob([data.buffer as ArrayBuffer], { type: "application/zip" });

  // Web: try File System Access API first
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: "Leitnix Backup",
            accept: { "application/zip": [".leitnix"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      if ((err as any).name !== "AbortError") {
        // Fall through
      } else {
        return;
      }
    }
  }

  // Fallback: anchor download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
