import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

/* The renderer reads two zustand stores and pulls in the stylesheet for KaTeX
   and mermaid; all three are stubbed so the test stays in the node
   environment and only exercises the React tree. */
vi.mock("../../../src/stores/settingStore", () => ({
  useSettingStore: () => ({
    isShowTranslationControl: false,
    defaultTranslationTarget: "fa",
    readAloudBadge: false,
  }),
}));
vi.mock("../../../src/stores/themeStore", () => ({
  useThemeStore: (sel: (state: { theme: string }) => unknown) => sel({ theme: "Dark" }),
}));
vi.mock("katex/dist/katex.min.css", () => ({}));

const DOC = [
  "# H1",
  "",
  "A paragraph with **bold**, *em*, `code`, [a link](https://example.com).",
  "",
  "- one",
  "- two",
  "  - nested",
  "",
  "1. first",
  "",
  "> quoted line",
  "",
  "| A | ب |",
  "| - | - |",
  "| 1 | 2 |",
  "",
  "```ts",
  "const x = 1;",
  "```",
  "",
  "- [ ] task",
  "",
  "---",
  "",
  "<div style=\"color:red\">raw html</div>",
  "",
  "$x^2$",
  "",
  "![img](https://example.com/a.png)",
].join("\n");

/** Tag names in the rendered HTML, with counts. */
function census(html: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const match of html.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)/g)) {
    out[match[1]] = (out[match[1]] ?? 0) + 1;
  }
  return out;
}

async function renderBoth() {
  const ReactMarkdown = (await import("react-markdown")).default;
  const remarkGfm = (await import("remark-gfm")).default;
  const remarkMath = (await import("remark-math")).default;
  const rehypeKatex = (await import("rehype-katex")).default;
  const { default: MarkdownRender } = await import(
    "../../../src/shared/components/markdownRender/MarkdownRender"
  );

  const plain = renderToStaticMarkup(
    React.createElement(ReactMarkdown, {
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeKatex],
      children: DOC,
    }) as never,
  );
  const viaRenderer = renderToStaticMarkup(
    React.createElement(MarkdownRender, { markdown: DOC }) as never,
  );
  return { plain, viaRenderer };
}

describe("MarkdownRender keeps every block's content", () => {
  it("renders the same inline elements a bare react-markdown does", async () => {
    // Regression: `p` and `li` destructured `children` out of props to inspect
    // them and never passed it on, so every paragraph and list item rendered
    // empty - taking the bold text, links, images, task checkboxes and inline
    // math inside them with it.
    const { plain, viaRenderer } = await renderBoth();
    const before = census(plain);
    const after = census(viaRenderer);

    for (const tag of [
      "p",
      "strong",
      "em",
      "code",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "table",
      "thead",
      "th",
      "td",
      "pre",
      "input",
      "hr",
      "img",
      "math",
    ]) {
      expect(after[tag], `<${tag}> count`).toBe(before[tag]);
    }
  });

  it("keeps the prose itself", async () => {
    const { viaRenderer } = await renderBoth();
    // Strip tags, then the markup: what a reader would actually see.
    const text = viaRenderer.replace(/<[^>]*>/g, "");
    for (const phrase of [
      "H1",
      "A paragraph with",
      "bold",
      "a link",
      "one",
      "nested",
      "first",
      "quoted line",
      "raw html",
      "task",
      "const x = 1;",
    ]) {
      expect(text, phrase).toContain(phrase);
    }
  });

  it("keeps the image and its alt text", async () => {
    const { viaRenderer } = await renderBoth();
    expect(viaRenderer).toMatch(/<img[^>]*alt="img"/);
  });

  it("renders no empty paragraph or list item", async () => {
    const { viaRenderer } = await renderBoth();
    expect(viaRenderer).not.toMatch(/<p[^>]*><\/p>/);
    expect(viaRenderer).not.toMatch(/<li[^>]*><\/li>/);
  });
});