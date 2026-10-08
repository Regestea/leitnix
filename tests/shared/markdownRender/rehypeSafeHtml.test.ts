import { describe, it, expect } from "vitest";
import {
  decodeMathEntities,
  markGeneratedElements,
  sanitizeRawHtml,
} from "../../../src/shared/components/markdownRender/rehypeSafeHtml";

interface TestNode {
  type?: string;
  tagName?: unknown;
  properties?: Record<string, unknown>;
  children?: TestNode[];
  value?: string;
}

function el(tagName: string, properties: Record<string, unknown> = {}, children: TestNode[] = []): TestNode {
  return { type: "element", tagName, properties, children };
}

function text(value: string): TestNode {
  return { type: "text", value };
}

describe("sanitizeRawHtml", () => {
  it("drops a script element and its subtree", () => {
    const tree: TestNode = {
      type: "root",
      children: [el("p", {}, [text("safe"), el("script", {}, [text("evil()")])])],
    };
    sanitizeRawHtml()(tree);
    const p = tree.children![0];
    // The script became an empty span: its tag is gone *and* so is its body.
    expect(p.children![1].tagName).toBe("span");
    expect(p.children![1].children).toEqual([]);
    expect(p.children![1].properties).toEqual({});
    // ...while the surrounding prose is untouched.
    expect(p.children![0].value).toBe("safe");
  });

  it("drops style, svg and form elements", () => {
    for (const tag of ["style", "svg", "form", "object", "embed"]) {
      const tree: TestNode = { type: "root", children: [el(tag)] };
      sanitizeRawHtml()(tree);
      expect(tree.children![0].tagName).toBe("span");
    }
  });

  it("keeps iframe, which cards use for embedded video", () => {
    const tree: TestNode = {
      type: "root",
      children: [el("iframe", { src: "https://www.youtube.com/embed/x", width: "560" })],
    };
    sanitizeRawHtml()(tree);
    expect(tree.children![0].tagName).toBe("iframe");
  });

  it("whitelists attributes on a raw element", () => {
    const tree: TestNode = {
      type: "root",
      children: [
        el("iframe", {
          src: "https://www.youtube.com/embed/x",
          width: "560",
          onload: "steal()",
          srcdoc: "<script>steal()</script>",
        }),
      ],
    };
    sanitizeRawHtml()(tree);
    const props = tree.children![0].properties!;
    expect(props.src).toBe("https://www.youtube.com/embed/x");
    expect(props.width).toBe("560");
    expect(props.onload).toBeUndefined();
    expect(props.srcdoc).toBeUndefined();
  });

  it("drops a style element and its CSS", () => {
    // On mobile the sanitizer is deliberately strict: inline CSS from model
    // output can stretch an element over the whole screen or hide it.
    const tree: TestNode = {
      type: "root",
      children: [el("style", {}, [text(".x { color: red }")])],
    };
    sanitizeRawHtml()(tree);
    expect(tree.children![0].tagName).toBe("span");
    expect(tree.children![0].children).toEqual([]);
  });

it("drops inline style and class from a raw element", () => {
    const tree: TestNode = {
      type: "root",
      children: [
        el("div", { className: "callout", id: "note", style: "color: red" }, [text("hi")]),
      ],
    };
    sanitizeRawHtml()(tree);
    const props = tree.children![0].properties!;
    expect(props.className).toBeUndefined();
    expect(props.id).toBeUndefined();
    expect(props.style).toBeUndefined();
    // ...while the text itself is untouched.
    expect(tree.children![0].children![0].value).toBe("hi");
  });

it("drops event handlers", () => {
    const tree: TestNode = {
      type: "root",
      children: [el("div", { onClick: "steal()", onmouseover: "steal()", title: "ok" })],
    };
    sanitizeRawHtml()(tree);
    const props = tree.children![0].properties!;
    expect(props.onClick).toBeUndefined();
    expect(props.onmouseover).toBeUndefined();
    expect(props.title).toBe("ok");
  });

it("drops svg", () => {
    const tree: TestNode = { type: "root", children: [el("svg", {}, [])] };
    sanitizeRawHtml()(tree);
    expect(tree.children![0].tagName).toBe("span");
  });

  it("keeps every attribute on a markdown-generated element", () => {
    // Stripping these would kill code highlighting and KaTeX styling.
    const tree: TestNode = {
      type: "root",
      children: [
        el("span", { dataLeitnixSafe: "true", className: ["token", "keyword"] }),
      ],
    };
    markGeneratedElements()(tree);
    const props = tree.children![0].properties!;
    expect(props.className).toEqual(["token", "keyword"]);

    sanitizeRawHtml()(tree);
    expect(props.className).toEqual(["token", "keyword"]);
    // ...but the internal marker never reaches React.
    expect(props.dataLeitnixSafe).toBeUndefined();
  });
});

describe("decodeMathEntities", () => {
  it("decodes an escaped operator inside a math node", () => {
    // Models write `\text{a} &lt; 1` because they are producing HTML.
    const tree: TestNode = {
      type: "root",
      children: [el("span", {}, [el("math", {}, [text("\\text{a} &lt; 1")])])],
    };
    decodeMathEntities()(tree);
    expect(tree.children![0].children![0].children![0].value).toBe("\\text{a} < 1");
  });

  it("leaves an escaped operator in prose alone", () => {
    // In prose `&lt;` legitimately means a `<`.
    const tree: TestNode = {
      type: "root",
      children: [el("p", {}, [text("a &lt; b")])],
    };
    decodeMathEntities()(tree);
    expect(tree.children![0].children![0].value).toBe("a &lt; b");
  });

  it("decodes double-escaped math to a fixed point", () => {
    const tree: TestNode = {
      type: "root",
      children: [el("math", {}, [text("x &amp;lt; 1")])],
    };
    decodeMathEntities()(tree);
    expect(tree.children![0].children![0].value).toBe("x < 1");
  });

  it("recognises the hyphenated inline-math tag name", () => {
    const tree: TestNode = {
      type: "root",
      children: [el("inline-math", {}, [text("a &lt; b")])],
    };
    decodeMathEntities()(tree);
    expect(tree.children![0].children![0].value).toBe("a < b");
  });
});