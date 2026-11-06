import { getDb } from "../../db/connection";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import JSZip from "jszip";
import { SaveFilePlugin } from "../../plugins/saveFile";
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

/** Overall backup progress, reported across the whole pipeline: reading the
 *  tables maps to 0-50%, packing the zip to 50-80%, writing the file to
 *  80-100%. */
export type BackupProgressCallback = (percent: number, message: string) => void;

export async function exportTables(
  options: BackupOptions,
  onProgress?: BackupProgressCallback,
): Promise<BackupDataPerTable> {
  const db = await getDb();
  const resolved = resolveDependencies(options.tables);
  const tables: BackupDataPerTable = {};

  const hasCardFilter =
    options.categoryTagFilter &&
    options.categoryTagFilter !== "all" &&
    options.categoryTagFilter.length > 0;

  for (const [index, table] of resolved.entries()) {
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
    onProgress?.(Math.floor(((index + 1) / resolved.length) * 50), `Reading ${table}...`);
  }

  return tables;
}

export async function createBackupZip(
  tables: BackupDataPerTable,
  onProgress?: BackupProgressCallback,
): Promise<Uint8Array> {
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

  /* JSZip compresses in chunks and reports real percentage here, so the bar
   * moves continuously even on a large backup. */
  return await zip.generateAsync({ type: "uint8array" }, (metadata) =>
    onProgress?.(Math.floor(50 + metadata.percent * 0.3), "Packing backup..."),
  );
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

/** Raw bytes handed to the bridge per write. A whole backup must not cross
 *  the Capacitor bridge in one message: a multi-megabyte base64 string
 *  OOMs/crashes the Android WebView, which is exactly the "app dies a few
 *  seconds after Backup" failure. Fixed-size chunks keep every message small. */
const NATIVE_WRITE_CHUNK_BYTES = 256 * 1024;

/** Base64 of one slice of `data`, built incrementally so no step ever holds
 *  the whole payload (Blob → readAsDataURL → split() made three full copies
 *  of the backup at once before the first byte reached disk). */
function toBase64Slice(data: Uint8Array, start: number, end: number): string {
  let binary = "";
  const step = 0x8000; // stay under String.fromCharCode's argument limit
  for (let i = start; i < end; i += step) {
    const sliceEnd = Math.min(i + step, end);
    binary += String.fromCharCode.apply(
      null,
      data.subarray(i, sliceEnd) as unknown as number[],
    );
  }
  return btoa(binary);
}

/** Writes `data` to `path` with bridge-safe chunked writes, reporting each
 *  finished chunk. Each `appendFile` call base64-decodes its own chunk
 *  independently, so the chunks need no 3-byte alignment — the decoded pieces
 *  concatenate back to the exact bytes. */
async function writeChunked(
  data: Uint8Array,
  path: string,
  directory: Directory,
  onChunk: (done: number, total: number) => void,
): Promise<void> {
  const totalChunks = Math.max(1, Math.ceil(data.length / NATIVE_WRITE_CHUNK_BYTES));
  let wroteChunks = 0;
  for (let start = 0; start < data.length; start += NATIVE_WRITE_CHUNK_BYTES) {
    const end = Math.min(start + NATIVE_WRITE_CHUNK_BYTES, data.length);
    const chunk = toBase64Slice(data, start, end);
    if (!wroteChunks) {
      await Filesystem.writeFile({ path, data: chunk, directory, recursive: true });
    } else {
      await Filesystem.appendFile({ path, data: chunk, directory });
    }
    wroteChunks++;
    onChunk(wroteChunks, totalChunks);
  }
  if (!wroteChunks) {
    await Filesystem.writeFile({ path, data: "", directory, recursive: true });
    onChunk(1, 1);
  }
}

function chunkProgress(onProgress?: BackupProgressCallback, message = "Saving file...") {
  return (done: number, total: number) =>
    onProgress?.(Math.floor(80 + (done / total) * 20), message);
}

export async function saveBackupBlob(
  data: Uint8Array,
  suggestedName: string,
  onProgress?: BackupProgressCallback,
): Promise<void> {
  const isCapacitor = Capacitor.isNativePlatform();

  if (isCapacitor) {
    if (Capacitor.getPlatform() === "android") {
      /* Stage the zip in the app-private cache (bridge-safe chunked writes),
       * then hand the choice of destination to the user via the system
       * "Save to..." dialog — it opens in Downloads but every folder the
       * device offers is reachable. The staged file is copied natively, so
       * no payload ever crosses the bridge at full size. If the user backs
       * out, fall back to the app Documents folder so nothing is lost. */
      const stagedName = `${suggestedName}.staging`;
      await writeChunked(data, stagedName, Directory.Cache, chunkProgress(onProgress));
      onProgress?.(100, "Choose where to save...");

      let savedToChoice = false;
      try {
        const stagedUri = await Filesystem.getUri({
          path: stagedName,
          directory: Directory.Cache,
        });
        const result = await SaveFilePlugin.saveAs({
          srcPath: stagedUri.uri,
          fileName: suggestedName,
          mimeType: "application/zip",
        });
        savedToChoice = !result.cancelled;
      } catch (err) {
        console.error("Save dialog failed", err);
      } finally {
        await Filesystem.deleteFile({ path: stagedName, directory: Directory.Cache });
      }

      if (!savedToChoice) {
        await writeChunked(data, suggestedName, Directory.Documents, chunkProgress(onProgress));
      }
      return;
    }

    /* iOS: the share sheet's "Save to Files" already lets the user pick any
     * folder, so the file lands in Documents and the sheet offers the rest. */
    await writeChunked(data, suggestedName, Directory.Documents, chunkProgress(onProgress));
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

  // Web: the file lands in one step, so just show the save phase started.
  onProgress?.(80, "Saving file...");

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
