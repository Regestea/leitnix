import { describe, it, expect } from "vitest";
import { Children, createElement, isValidElement } from "react";
import MarkdownTable from "../../../src/shared/components/markdownTable/MarkdownTable";

/**
 * The rendered output is walked here rather than the hast tree, so these
 * stand-ins mimic what react-markdown produces after the components map has
 * run: a `<table>` holding `<thead>`/`<tbody>` sections of `<tr>` rows.
 */
type El = ReactElement<{ children?: ReactNode; dir?: string; style?: unknown }>;

function el(type: string, children: ReactNode): El {
  return createElement(type, null, children);
}

function childTypes(node: unknown): string[] {
  if (!isValidElement(node)) return [];
  return Children.toArray((node.props as { children?: ReactNode }).children).map((child) =>
    isValidElement(child) ? String(child.type) : `#${typeof child}`,
  );
}

/** Depth-first walk, yielding every element under `node`. */
function walk(node: unknown, out: El[] = []): El[] {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, out);
    return out;
  }
  if (!isValidElement(node)) return out;
  const element = node as El;
  out.push(element);
  for (const child of Children.toArray(element.props.children)) walk(child, out);
  return out;
}

/** Invokes the component and returns its inner `<table>` element.
 *
 *  Called as a plain function rather than through `createElement` + a
 *  renderer: the component uses no hooks, and this repo's vitest setup is
 *  node-only (no jsdom, no react-test-renderer). */
function renderTable(children: ReactNode): El {
  const host = MarkdownTable({ children });
  const table = walk(host).find((child) => child.type === "table");
  if (!table) throw new Error("no table rendered");
  return table;
}

function cellOf(table: El, type: "td" | "th"): El {
  const cell = walk(table).find((child) => child.type === type);
  if (!cell) throw new Error(`no ${type} rendered`);
  return cell;
}

describe("MarkdownTable structure", () => {
  it("keeps thead and tbody between the table and its rows", () => {
    // The browser only accepts <tr> inside one of these three sections;
    // hoisting the rows up to <table> level is invalid markup and causes a
    // hydration error.
    const table = renderTable([
      el("thead", [el("tr", [el("th", "H1"), el("th", "H2")])]),
      el("tbody", [el("tr", [el("td", "a"), el("td", "b")])]),
    ]);

    expect(childTypes(table)).toEqual(["thead", "tbody"]);
    // ...and each of those sections still wraps its rows.
    const thead = walk(table).find((child) => child.type === "thead")!;
    const tbody = walk(table).find((child) => child.type === "tbody")!;
    expect(childTypes(thead)).toEqual(["tr"]);
    expect(childTypes(tbody)).toEqual(["tr"]);
  });

  it("keeps a tfoot in place", () => {
    const table = renderTable([
      el("tbody", [el("tr", [el("td", "x")])]),
      el("tfoot", [el("tr", [el("td", "total")])]),
    ]);
    expect(childTypes(table)).toEqual(["tbody", "tfoot"]);
  });

  it("never puts a tr or td directly under the table", () => {
    const table = renderTable([
      el("thead", [el("tr", [el("th", "A")])]),
      el("tbody", [el("tr", [el("td", "1"), el("td", "2")])]),
    ]);
    const direct = childTypes(table);
    expect(direct).not.toContain("tr");
    expect(direct).not.toContain("td");
  });

  it("keeps a bare row for a raw-HTML table with no sections", () => {
    // A hand-written <table> may hold rows with no <tbody> at all.
    const table = renderTable([el("tr", [el("td", "سلام")])]);
    expect(childTypes(table)).toEqual(["tr"]);
    expect(cellOf(table, "td").props.dir).toBe("rtl");
  });

  it("stamps dir per cell rather than per table", () => {
    const table = renderTable([
      el("thead", [el("tr", [el("th", "Name"), el("th", "توضیح")])]),
      el("tbody", [el("tr", [el("td", "hello"), el("td", "سلام")])]),
    ]);
    const cells = walk(table).filter((child) => child.type === "td");
    expect(cells).toHaveLength(2);
    expect(cells[0].props.dir).toBe("ltr");
    expect(cells[1].props.dir).toBe("rtl");
  });

  it("falls back to the column direction when a cell carries no words", () => {
    // The Persian header decides the column, so a numeric cell in that column
    // still aligns the way its column reads.
    const table = renderTable([
      el("thead", [el("tr", [el("th", "توضیح")])]),
      el("tbody", [el("tr", [el("td", "۱۲۳")])]),
    ]);
    expect(cellOf(table, "td").props.dir).toBe("rtl");
  });

  it("aligns the cell to the direction it was given", () => {
    const table = renderTable([
      el("thead", [el("tr", [el("th", "Name")])]),
      el("tbody", [el("tr", [el("td", "سلام")])]),
    ]);
    expect(cellOf(table, "td").props.style).toMatchObject({ textAlign: "right" });
  });

  it("leaves non-element children alone", () => {
    const table = renderTable([el("tbody", [el("tr", [el("td", "x")])]), "trailing text"]);
    expect(childTypes(table)).toEqual(["tbody", "#string"]);
  });
});