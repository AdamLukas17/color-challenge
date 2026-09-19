import { describe, it, expect } from "vitest";
import {
  getColorForDate,
  paletteForMonth,
  PALETTE,
  PALETTE_V2,
  CUTOVER_MONTH,
} from "../logic.js";

/*
 * Freeze-forward regression guard.
 *
 * These hexes were captured from the pre-refactor generator (single 101-color
 * palette). The Nov 2026 update adds 100 new colors, but they must only affect
 * months >= CUTOVER_MONTH. Every date below is before the cutover, so its color
 * must never change — if one of these fails, the palette change leaked into the
 * past and would rewrite history on days users already played.
 *
 * Keep this fixture identical (same dates, same expected hexes) across the
 * web / Android / iOS regression tests.
 */
const FROZEN = {
  "2024-02-29": "#FFE066",
  "2025-01-01": "#7F5539",
  "2025-02-14": "#6A4C93",
  "2025-06-30": "#FF758F",
  "2025-12-31": "#90BE6D",
  "2026-01-15": "#023047",
  "2026-02-28": "#90BE6D",
  "2026-03-01": "#F5EBE0",
  "2026-07-04": "#9BF6FF",
  "2026-09-01": "#F72585",
  "2026-09-18": "#A4C3B2",
  "2026-09-30": "#F0E6EF",
  "2026-10-01": "#3A86A7",
  "2026-10-15": "#43AA8B",
  "2026-10-31": "#8AC926",
};

describe("freeze-forward: pre-cutover colors are frozen", () => {
  for (const [date, hex] of Object.entries(FROZEN)) {
    it(`${date} stays ${hex}`, () => {
      expect(date.slice(0, 7) < CUTOVER_MONTH).toBe(true); // guard: fixture is pre-cutover
      expect(getColorForDate(date).hex).toBe(hex);
    });
  }
});

describe("freeze-forward: palette selection by month", () => {
  it("uses the original palette before the cutover", () => {
    expect(paletteForMonth("2026-10")).toBe(PALETTE);
    expect(paletteForMonth("2020-01")).toBe(PALETTE);
  });

  it("uses V2 from the cutover month onward", () => {
    expect(paletteForMonth(CUTOVER_MONTH)).toBe(PALETTE_V2);
    expect(paletteForMonth("2027-05")).toBe(PALETTE_V2);
  });

  it("V2 preserves the original palette as its ordered prefix", () => {
    expect(PALETTE_V2.slice(0, PALETTE.length)).toEqual(PALETTE);
  });
});
