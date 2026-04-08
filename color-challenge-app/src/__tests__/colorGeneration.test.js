import { describe, it, expect } from "vitest";
import { getColorForDate, PALETTE, rgbDistance, MIN_CONSECUTIVE_DISTANCE } from "../logic.js";

describe("getColorForDate", () => {
  it("returns an object with hex and name", () => {
    const color = getColorForDate("2026-04-07");
    expect(color).toHaveProperty("hex");
    expect(color).toHaveProperty("name");
    expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("is deterministic — same date returns same color", () => {
    const c1 = getColorForDate("2026-04-07");
    const c2 = getColorForDate("2026-04-07");
    expect(c1).toEqual(c2);
  });

  it("different days in same month get different colors", () => {
    const c1 = getColorForDate("2026-04-01");
    const c2 = getColorForDate("2026-04-02");
    // They should differ (no repeats in month)
    expect(c1.hex).not.toBe(c2.hex);
  });

  it("returns a color from the PALETTE", () => {
    const color = getColorForDate("2026-04-15");
    const inPalette = PALETTE.some((p) => p.hex === color.hex && p.name === color.name);
    expect(inPalette).toBe(true);
  });

  it("no duplicates within a month", () => {
    const hexes = [];
    for (let day = 1; day <= 30; day++) {
      const dateStr = `2026-04-${String(day).padStart(2, "0")}`;
      hexes.push(getColorForDate(dateStr).hex);
    }
    const unique = new Set(hexes);
    expect(unique.size).toBe(30);
  });

  it("consecutive days have visually distinct colors (RGB distance >= 100)", () => {
    for (let day = 1; day < 30; day++) {
      const d1 = `2026-04-${String(day).padStart(2, "0")}`;
      const d2 = `2026-04-${String(day + 1).padStart(2, "0")}`;
      const c1 = getColorForDate(d1);
      const c2 = getColorForDate(d2);
      const dist = rgbDistance(c1.hex, c2.hex);
      expect(dist).toBeGreaterThanOrEqual(MIN_CONSECUTIVE_DISTANCE);
    }
  });

  it("handles February (28 days)", () => {
    const color = getColorForDate("2026-02-28");
    expect(color).toHaveProperty("hex");
    const inPalette = PALETTE.some((p) => p.hex === color.hex);
    expect(inPalette).toBe(true);
  });

  it("handles February leap year (29 days)", () => {
    const color = getColorForDate("2028-02-29");
    expect(color).toHaveProperty("hex");
    const inPalette = PALETTE.some((p) => p.hex === color.hex);
    expect(inPalette).toBe(true);
  });

  it("handles January (31 days) with no duplicates", () => {
    const hexes = [];
    for (let day = 1; day <= 31; day++) {
      const dateStr = `2026-01-${String(day).padStart(2, "0")}`;
      hexes.push(getColorForDate(dateStr).hex);
    }
    const unique = new Set(hexes);
    expect(unique.size).toBe(31);
  });

  it("different months produce different color sequences", () => {
    const aprilColors = [];
    const mayColors = [];
    for (let day = 1; day <= 5; day++) {
      aprilColors.push(getColorForDate(`2026-04-${String(day).padStart(2, "0")}`).hex);
      mayColors.push(getColorForDate(`2026-05-${String(day).padStart(2, "0")}`).hex);
    }
    // At least one day should differ between months
    const allSame = aprilColors.every((h, i) => h === mayColors[i]);
    expect(allSame).toBe(false);
  });

  it("palette has exactly 101 colors", () => {
    expect(PALETTE.length).toBe(101);
  });

  it("all palette entries have valid hex and name", () => {
    for (const color of PALETTE) {
      expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof color.name).toBe("string");
      expect(color.name.length).toBeGreaterThan(0);
    }
  });
});
