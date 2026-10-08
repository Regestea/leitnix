// MarkdownTable.tsx
import React from "react";
import type { ReactNode } from "react";
import { getTextDir, textAlignForDir } from "../markdownRender/direction";
import type { TextDir } from "../markdownRender/direction";
import { textOfChildren } from "../markdownRender/markdownSource";
import styles from "./MarkdownTable.module.css";

interface MdNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: MdNode[];
}

function toMdNode(value: unknown): MdNode | null {
  return value && typeof value === "object" ? (value as MdNode) : null;
}

function mdText(node: MdNode | null): string {
  if (!node) return "";
  if (node.type === "text" || node.type === "raw") return node.value ?? "";
  return (node.children ?? []).map((child) => mdText(child)).join("");
}

/** One parsed row's cells, skipping the text nodes remark leaves between
 *  elements. */
function rowCells(row: MdNode): (MdNode | null)[] {
  return (row.children ?? [])
    .filter((child) => child.tagName === "td" || child.tagName === "th")
    .map(toMdNode);
}

/**
 * GFM tables are plain `<table>` markup, so the direction of a cell is only
 * as good as the content it holds. A table whose header is English but whose
 * cells are Persian is common in bilingual cards, and leaving those cells
 * without a `dir` inherits the table's direction and left-aligns them.
 *
 * Two sources are combined: the hast tree gives the column-level answer (a
 * column whose header is Persian is Persian throughout), and the *rendered*
 * children give the per-cell answer, because the components map may have
 * replaced a cell with something richer (a KaTeX formula, a nested list) and
 * only the rendered text decides the direction. The cell's own text wins, so
 * one Persian cell inside an English column still reads right-to-left.
 */
export default function MarkdownTable({
  children,
  node,
}: {
  children?: ReactNode;
  node?: unknown;
}) {
  const root = toMdNode(node);
  const thead = (root?.children ?? []).find((child) => child.tagName === "thead");
  const tbody = (root?.children ?? []).find((child) => child.tagName === "tbody");
  const headerCells = (thead?.children?.[0]?.children ?? []).map(toMdNode);
  const rowNodes = (tbody?.children ?? [])
    .filter((row) => row.tagName === "tr")
    .map((row) => rowCells(row));

  const columnDirs: TextDir[] = headerCells.map((header, index) => {
    const headerDir = getTextDir(mdText(header));
    if (headerDir) return headerDir;
    for (const row of rowNodes) {
      const dir = getTextDir(mdText(row[index]));
      if (dir) return dir;
    }
    return undefined;
  });

  /** True for a rendered element that carries children. `MarkdownTable` walks
 *  the already-rendered output (not the hast tree) because the components map
 *  may have replaced a cell with a richer component. */
const isElement = (part: ReactNode): part is React.ReactElement<{ children?: ReactNode }> =>
  React.isValidElement(part) && (part.props as { children?: unknown })?.children !== undefined;

  /** Stamps `dir`/`text-align` on the cells of one rendered row. */
  const withDir = (cells: ReactNode[], rowKey: string) =>
    cells.map((cell, columnIndex) => {
      if (!React.isValidElement(cell)) return cell;
      const cellChildren = (cell.props as { children?: ReactNode }).children;
      const dir = getTextDir(textOfChildren(cellChildren)) ?? columnDirs[columnIndex];
      const textAlign = textAlignForDir(dir);
      return React.cloneElement(cell as React.ReactElement<Record<string, unknown>>, {
        dir,
        style: textAlign ? { textAlign } : undefined,
        key: `${rowKey}-${columnIndex}`,
      });
    });

  /** Stamps `dir`/`text-align` on the cells of one rendered row. */
  const withRowDir = (row: ReactNode, rowKey: string): ReactNode => {
    if (!isElement(row) || row.type !== "tr") return row;
    return React.cloneElement(row, {
      key: rowKey,
      children: withDir(React.Children.toArray(row.props.children), rowKey),
    });
  };

  /** react-markdown hands over `<thead>`/`<tbody>` sections, and the browser
   *  only accepts `<tr>` inside one of them. The sections are rebuilt with
   *  their rows' cells stamped, rather than flattened: hoisting the rows to
   *  the `<table>` level produces invalid markup and a hydration error. */
  const SECTION_TAGS = new Set(["thead", "tbody", "tfoot"]);

  const sections = React.Children.toArray(children).map((part, index) => {
    if (!isElement(part)) return part;
    const isSection =
      typeof part.type === "string" && SECTION_TAGS.has(part.type);
    // A bare `<tr>` (raw-HTML table with no sections) still needs its cells
    // stamped; there is no wrapper to rebuild in that case.
    if (!isSection && part.type !== "tr") return part;
    if (!isSection) return withRowDir(part, String(index));
    return React.cloneElement(part, {
      key: `section-${index}`,
      children: React.Children.toArray(part.props.children).map((row, rowIndex) =>
        withRowDir(row, `${index}-${rowIndex}`),
      ),
    });
  });

  return (
    <div className={styles.markdownTableWrapper}>
      <table className={styles.table}>{sections}</table>
    </div>
  );
}