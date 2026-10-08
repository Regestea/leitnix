import { describe, it, expect } from "vitest";
import { isBlankDocument } from "../../../src/shared/components/markdownRender/blankDocument";

/** Stands in for the rendered host element. `elements` are the selectors that
 *  `querySelector` should "find" - the visible things a document can hold
 *  without any text. */
function host(text: string, elements: string[] = []): {
  textContent: string | null;
  querySelector: (selectors: string) => unknown;
} {
  return {
    textContent: text,
    querySelector: (selectors: string) =>
      elements.some((element) => selectors.includes(element)) ? {} : null,
  };
}

describe("isBlankDocument", () => {
  it("is blank when the render produced no text and no visuals", () => {
    expect(isBlankDocument(host(""))).toBe(true);
    expect(isBlankDocument(host("   \n  "))).toBe(true);
  });

  it("is not blank when any text came through", () => {
    expect(isBlankDocument(host("hello"))).toBe(false);
  });

  it("is not blank for a document that is only an image", () => {
    // A picture-only card must not be "rescued" by the fallback.
    expect(isBlankDocument(host("", ["img"]))).toBe(false);
  });

  it("is not blank for a document that is only a diagram or an embed", () => {
    expect(isBlankDocument(host("", ["svg"]))).toBe(false);
    expect(isBlankDocument(host("", ["iframe"]))).toBe(false);
    expect(isBlankDocument(host("", ["table"]))).toBe(false);
  });

  it("is not blank for a document that is only code", () => {
    // A fenced block whose body is whitespace still shows a frame.
    expect(isBlankDocument(host("", ["pre"]))).toBe(false);
    expect(isBlankDocument(host("", ["code"]))).toBe(false);
  });

  it("has no opinion before the element exists", () => {
    // The ref fires with null on unmount; treating that as blank would flip
    // the fallback on and then off again in a loop.
    expect(isBlankDocument(null)).toBe(false);
  });

  it("tolerates a null textContent", () => {
    expect(isBlankDocument(host(null))).toBe(true);
  });
});