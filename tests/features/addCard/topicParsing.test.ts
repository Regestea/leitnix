import { describe, it, expect } from "vitest";
import { parseTopics, TOPIC_MODES, TOPIC_MODE_LABELS } from "../../../src/features/addCard/types";

describe("parseTopics", () => {
  it("splits each non-empty line into a topic", () => {
    expect(parseTopics("Photosynthesis\nNewton's Laws\nBig-O")).toEqual([
      "Photosynthesis",
      "Newton's Laws",
      "Big-O",
    ]);
  });

  it("trims surrounding whitespace of each line", () => {
    expect(parseTopics("  Photosynthesis  \n\tBig-O \n")).toEqual([
      "Photosynthesis",
      "Big-O",
    ]);
  });

  it("skips blank and whitespace-only lines", () => {
    expect(parseTopics("\nPhotosynthesis\n   \n\nBig-O\n")).toEqual([
      "Photosynthesis",
      "Big-O",
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseTopics("Photosynthesis\r\nBig-O\r\n")).toEqual([
      "Photosynthesis",
      "Big-O",
    ]);
  });

  it("keeps inner whitespace intact", () => {
    expect(parseTopics("Time complexity of quick sort")).toEqual([
      "Time complexity of quick sort",
    ]);
  });

  it("returns an empty array for empty or blank input", () => {
    expect(parseTopics("")).toEqual([]);
    expect(parseTopics("   \n \t \n")).toEqual([]);
  });
});

describe("TOPIC_MODES", () => {
  it("defaults to single mode with labels for both modes", () => {
    expect(TOPIC_MODES).toEqual(["single", "multiple"]);
    expect(TOPIC_MODE_LABELS.single).toBe("Single Topic");
    expect(TOPIC_MODE_LABELS.multiple).toBe("Multiple Topics");
  });
});
