import { describe, expect, it } from "vitest";
import { cutoffIso } from "../src/retention";

describe("cutoffIso", () => {
  it("returns a timestamp exactly N days before now", () => {
    const now = Date.UTC(2026, 0, 8, 12, 0, 0); // 2026-01-08T12:00:00Z
    expect(cutoffIso(7, now)).toBe("2026-01-01T12:00:00.000Z");
  });

  it("returns now itself for a 0-day retention window", () => {
    const now = Date.UTC(2026, 0, 8, 12, 0, 0);
    expect(cutoffIso(0, now)).toBe(new Date(now).toISOString());
  });
});
