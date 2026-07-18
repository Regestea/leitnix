import { describe, it, expect } from "vitest";
import {
  calculateNextReviewTime,
  unixTimeNow,
} from "../../src/extensions/timeExtension";

describe("calculateNextReviewTime", () => {
  it("returns fromTime + intervalSeconds when interval is less than 86400", () => {
    const fromTime = 1000000;
    const result = calculateNextReviewTime(3600, fromTime);
    expect(result).toBe(1003600);
  });

  it("returns startOfDay + interval for intervals >= 86400", () => {
    const fromTime = Math.floor(
      new Date(2025, 0, 15, 10, 30, 0).getTime() / 1000,
    );
    const result = calculateNextReviewTime(86400, fromTime);
    const startOfDay = Math.floor(
      new Date(2025, 0, 15).getTime() / 1000,
    );
    expect(result).toBe(startOfDay + 86400);
  });

  it("uses unixTimeNow when fromTime is not provided", () => {
    const now = unixTimeNow();
    const result = calculateNextReviewTime(7200);
    expect(result).toBeGreaterThanOrEqual(now + 7200);
    expect(result).toBeLessThanOrEqual(now + 7200 + 1);
  });

  it("handles multiple day intervals correctly", () => {
    const fromTime = Math.floor(
      new Date(2025, 5, 1, 8, 0, 0).getTime() / 1000,
    );
    const result = calculateNextReviewTime(172800, fromTime);
    const startOfDay = Math.floor(
      new Date(2025, 5, 1).getTime() / 1000,
    );
    expect(result).toBe(startOfDay + 172800);
  });
});
