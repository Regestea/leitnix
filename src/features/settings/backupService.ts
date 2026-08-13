import { getDb } from "../../db/connection";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import JSZip from "jszip";
import type { BackupTable, BackupOptions, BackupDataPerTable } from "./backupTypes.ts";

export interface RestoreProgress {
  current: number;
  total: number;
  message: string;
}

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
    "Topic",
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

function getRowValues(row: Record<string, unknown>, columns: string[], table: BackupTable): (string | number | boolean | null)[] {
  if (table === "Boxes") {
    return columns.map((col) => {
      if (col === "NextBoxId" || col === "PreviousBoxId") return null;
      return (row as Record<string, unknown>)[col] as string | number | boolean | null ?? null;
    });
  }
  return columns.map((col) => {
    return (row as Record<string, unknown>)[col] as string | number | boolean | null ?? null;
  });
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function importBackupZip(
  tables: BackupDataPerTable,
  onProgress?: (progress: RestoreProgress) => void,
): Promise<void> {
  const db = await getDb();

  const DELETE_BATCH = 500;
  const INSERT_BATCH = 500;

  const tablesWithData: BackupTable[] = [];
  let totalRows = 0;
  for (const table of BACKUP_ORDER) {
    const rows = tables[table];
    if (rows && rows.length > 0) {
      tablesWithData.push(table);
      totalRows += rows.length;
    }
  }

  let current = 0;

  function emit(msg: string) {
    onProgress?.({ current, total: totalRows, message: msg });
  }

  // Phase 1: Delete existing data in reverse FK order, batched by ID chunk
  const reverseOrder = [...tablesWithData].reverse();
  for (const table of reverseOrder) {
    const rows = tables[table]!;
    const ids = rows.map((r) => (r as Record<string, unknown>).Id as string).filter(Boolean);
    if (ids.length === 0) continue;

    const deleteSet: { statement: string; values?: unknown[] }[] = [];
    const idChunks = chunkArray(ids, DELETE_BATCH);
    for (const chunk of idChunks) {
      const placeholders = chunk.map(() => "?").join(",");
      if (table === "Boxes") {
        deleteSet.push({
          statement: `UPDATE Boxes SET NextBoxId=NULL, PreviousBoxId=NULL WHERE Id IN (${placeholders});`,
          values: chunk,
        });
      }
      deleteSet.push({
        statement: `DELETE FROM ${table} WHERE Id IN (${placeholders});`,
        values: chunk,
      });
    }
    await db.executeSet(deleteSet);
  }

  current = 0;

  // Phase 2: Insert backup data in FK-safe order, batched multi-row INSERTs
  let lastEmitPct = -1;
  for (const table of tablesWithData) {
    const rows = tables[table]!;
    const columns = TABLE_COLUMNS[table];
    const rowBatches = chunkArray(rows, INSERT_BATCH);

    const insertSet: { statement: string; values?: unknown[] }[] = [];
    for (const batch of rowBatches) {
      const rowPlaceholders = `(${columns.map(() => "?").join(",")})`;
      const allPlaceholders = Array(batch.length).fill(rowPlaceholders).join(",");
      const values = batch.flatMap((row) =>
        getRowValues(row as Record<string, unknown>, columns, table),
      );

      current += batch.length;

      const pct = Math.floor((current / totalRows) * 100);
      if (pct !== lastEmitPct) {
        lastEmitPct = pct;
        emit(`Restoring ${table} (${current}/${totalRows})...`);
      }

      insertSet.push({
        statement: `INSERT OR REPLACE INTO ${table} (${columns.join(",")}) VALUES ${allPlaceholders};`,
        values,
      });
    }
    await db.executeSet(insertSet);
  }

  emit(`Restoring... (${current}/${totalRows})`);

  // Phase 3: Second pass for Boxes — restore self-referential FKs
  const boxRows = tables["Boxes"];
  if (boxRows && boxRows.length > 0) {
    for (const row of boxRows) {
      const r = row as Record<string, unknown>;
      const id = r.Id as string;
      const nextBoxId = r.NextBoxId;
      const prevBoxId = r.PreviousBoxId;
      if (nextBoxId != null || prevBoxId != null) {
        current++;
        emit(`Reconnecting box relationships (${current}/${totalRows})...`);
        await db.run(
          "UPDATE Boxes SET NextBoxId=?, PreviousBoxId=? WHERE Id=?;",
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
