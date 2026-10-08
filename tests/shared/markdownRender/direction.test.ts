import { describe, it, expect } from "vitest";
import {
  classifyWord,
  getTextDir,
  textAlignForDir,
} from "../../../src/shared/components/markdownRender/direction";

describe("getTextDir", () => {
  it("treats a Persian sentence with a long Latin token as rtl", () => {
    // "TypeScript" is 10 letters but is one word; the Persian words outnumber
    // it, which per-letter counting would get wrong.
    expect(getTextDir("استفاده از useEffect در React با TypeScript")).toBe("rtl");
  });

  it("treats a Persian sentence with one Latin word as rtl", () => {
    expect(getTextDir("useEffect برای همگام‌سازی وضعیت")).toBe("rtl");
  });

  it("treats a Latin sentence as ltr", () => {
    expect(getTextDir("React hooks let you share state")).toBe("ltr");
  });

  it("ignores neutral words when counting", () => {
    expect(getTextDir("1- hello world")).toBe("ltr");
  });

  it("resolves a leading Persian or Arabic digit to rtl", () => {
    expect(getTextDir("۱. اولین مورد")).toBe("rtl");
    expect(getTextDir("١. first item")).toBe("rtl");
  });

  it("resolves digits-and-punctuation-only text to ltr", () => {
    // Unicode resolves a paragraph with no strong character to LTR; the list
    // markers and decimal points belong on the left for that reason.
    expect(getTextDir("1.5 - 2.5")).toBe("ltr");
  });

  it("returns undefined for empty or whitespace text", () => {
    expect(getTextDir("")).toBeUndefined();
    expect(getTextDir("   \n ")).toBeUndefined();
  });

  it("falls back to the first strong letter when word counts are equal", () => {
    // One fa word, one en word: neither wins, so the opener decides.
    expect(getTextDir("سلام React")).toBe("rtl");
    expect(getTextDir("hello سلام")).toBe("ltr");
  });

  it("reads a Persian digit as neutral when it does not lead", () => {
    // "hello ۱۲۳": the digits vote for nothing, so the Latin word decides.
    expect(getTextDir("hello ۱۲۳")).toBe("ltr");
  });
});

describe("classifyWord", () => {
  it("returns undefined for digits and punctuation only", () => {
    expect(classifyWord("123")).toBeUndefined();
    expect(classifyWord("...")).toBeUndefined();
    expect(classifyWord("۵۰")).toBeUndefined();
  });

  it("returns the direction of the first letter it finds", () => {
    expect(classifyWord("hello")).toBe("ltr");
    expect(classifyWord("سلام")).toBe("rtl");
    expect(classifyWord("1hello")).toBe("ltr");
    expect(classifyWord("۱سلام")).toBe("rtl");
  });
});

describe("textAlignForDir", () => {
  it("maps a direction to its alignment", () => {
    expect(textAlignForDir("rtl")).toBe("right");
    expect(textAlignForDir("ltr")).toBe("left");
  });

  it("has no opinion when there is no direction", () => {
    expect(textAlignForDir(undefined)).toBeUndefined();
  });
});