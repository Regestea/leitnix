import { describe, it, expect } from "vitest";
import { safeUrlTransform } from "../../../src/shared/components/markdownRender/safeUrl";

describe("safeUrlTransform", () => {
  it("keeps an https link", () => {
    expect(safeUrlTransform("https://example.com/a", "href")).toBe(
      "https://example.com/a",
    );
  });

  it("keeps an http link", () => {
    expect(safeUrlTransform("http://example.com", "href")).toBe("http://example.com");
  });

  it("blanks a javascript: link so it cannot execute", () => {
    expect(safeUrlTransform("javascript:alert(1)", "href")).toBe("");
  });

  it("blanks a data: link", () => {
    expect(safeUrlTransform("data:text/html,<script>alert(1)</script>", "href")).toBe("");
  });

  it("blanks a fragment and a relative path on a link", () => {
    // Either would navigate the app window nowhere useful.
    expect(safeUrlTransform("#section", "href")).toBe("");
    expect(safeUrlTransform("./local/page.md", "href")).toBe("");
  });

  it("blanks an empty href", () => {
    expect(safeUrlTransform("", "href")).toBe("");
  });

  it("keeps an https image source", () => {
    expect(safeUrlTransform("https://example.com/a.png", "src")).toBe(
      "https://example.com/a.png",
    );
  });

  it("keeps a data: image source", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
    expect(safeUrlTransform(dataUrl, "src")).toBe(dataUrl);
  });

  it("blanks a javascript: image source", () => {
    expect(safeUrlTransform("javascript:alert(1)", "src")).toBe("");
  });
});