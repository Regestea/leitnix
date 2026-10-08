import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  fileURLToPath(
    new URL("../../../src/shared/components/markdownRender/MarkdownRender.module.css", import.meta.url),
  ),
  "utf8",
);

/** Declarations of every rule whose selector ends in `.selector`, comments
 *  stripped so a property named inside one is not counted. */
function rule(selector: string): string {
  const pattern = new RegExp(`\\.${selector}(?![\\w-])\\s*\\{([^}]*)\\}`, "g");
  const found: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(css)) !== null) found.push(match[1]);
  return found.join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Declared value of one property, e.g. "0" or "0.3rem". */
function value(selector: string, property: string): string | undefined {
  const match = new RegExp(`${property}:\\s*([^;]+)`).exec(rule(selector));
  return match ? match[1].trim() : undefined;
}

/** The same value as a number of rem, for comparing magnitudes. Unitless
 *  values (a bare `0`) count as 0. */
function rem(selector: string, property: string): number | undefined {
  const raw = value(selector, property);
  if (raw === undefined) return undefined;
  if (/^-?[\d.]+$/.test(raw)) return Number(raw);
  const match = /^(-?[\d.]+)rem$/.exec(raw);
  return match ? Number(match[1]) : undefined;
}

describe("list markers", () => {
  it("draws the marker inside the item, so it cannot widen the layout", () => {
    // Regression: with the default `list-style-position: outside` the marker
    // needs room reserved beside the item. A list decides its direction from
    // all items together while each item carries its own, so in a mixed-
    // direction list the marker lands on the side nothing was reserved for,
    // and a wide marker (a two-digit `ol` number) overflows the same way. The
    // browser then lets it stick out past the card, so the page has to be
    // scrolled sideways to read it.
    expect(rule("list")).toContain("list-style-position: inside");
  });

  it("reserves no width on the list for the marker", () => {
    expect(rem("list", "padding-inline-start")).toBe(0);
  });

  it("leaves only a small gap after the marker on the item", () => {
    // Inside the box either way, so this is breathing room, not room to hold
    // a marker that overhangs.
    const gap = rem("listItem", "padding-inline-start");
    expect(gap).toBeDefined();
    expect(gap!).toBeLessThan(0.5);
  });

  it("never indents an item sideways with a margin", () => {
    expect(rule("listItem")).not.toContain("margin-inline-start");
  });

  it("indents nested lists with a margin instead", () => {
    // A margin lives inside the parent's box, so depth can never widen the
    // layout the way padding can.
    expect(rem("list \\.list", "margin-inline-start")).toBeGreaterThan(0);
  });

  it("keeps a task item's text on the marker's line", () => {
    // `inside` puts the marker at the start of the item's first line box, so a
    // block-level paragraph as the first child would push the marker onto a
    // line of its own.
    expect(rule("listItem > p")).toContain("display: inline");
  });
});