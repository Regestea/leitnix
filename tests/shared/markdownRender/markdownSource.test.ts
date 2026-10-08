import { describe, it, expect } from "vitest";
import {
  escapeHtmlInMarkdown,
  textOfChildren,
} from "../../../src/shared/components/markdownRender/markdownSource";

describe("escapeHtmlInMarkdown", () => {
  it("escapes a stray tag in prose so it renders as text", () => {
    expect(escapeHtmlInMarkdown("a <div> here")).toBe("a &lt;div> here");
  });

  it("leaves fenced code blocks untouched", () => {
    const source = ["```tsx", "const x = <div />;", "```"].join("\n");
    expect(escapeHtmlInMarkdown(source)).toBe(source);
  });

  it("leaves inline code spans untouched so they keep teaching the tag", () => {
    expect(escapeHtmlInMarkdown("use `<div>` here")).toBe("use `<div>` here");
  });

  it("keeps <br> as a real line break", () => {
    expect(escapeHtmlInMarkdown("one<br>two")).toBe("one<br>two");
    expect(escapeHtmlInMarkdown("one<br/>two")).toBe("one<br>two");
    expect(escapeHtmlInMarkdown("one<br />two")).toBe("one<br>two");
  });

  it("closes a fence before escaping resumes", () => {
    const source = ["```", "<b>", "```", "<i>"].join("\n");
    expect(escapeHtmlInMarkdown(source)).toBe(
      ["```", "<b>", "```", "&lt;i>"].join("\n"),
    );
  });

  it("returns the input unchanged when it holds no angle bracket", () => {
    const source = "plain text";
    expect(escapeHtmlInMarkdown(source)).toBe(source);
  });

  it("handles a multi-backtick fence", () => {
    const source = ["````md", "<div>", "````", "<span>"].join("\n");
    expect(escapeHtmlInMarkdown(source)).toBe(
      ["````md", "<div>", "````", "&lt;span>"].join("\n"),
    );
  });
});

describe("textOfChildren", () => {
  it("reads a string child", () => {
    expect(textOfChildren("hello")).toBe("hello");
  });

  it("joins an array of children", () => {
    expect(textOfChildren(["a", "b", "c"])).toBe("abc");
  });

  it("reads through a nested element", () => {
    // Mirrors what react-markdown hands over for "Persian <strong>word</strong>".
    const element = { props: { children: ["سلام ", { props: { children: "دنیا" } }] } };
    expect(textOfChildren(element)).toBe("سلام دنیا");
  });

  it("returns an empty string for null and undefined", () => {
    expect(textOfChildren(null)).toBe("");
    expect(textOfChildren(undefined)).toBe("");
  });
});