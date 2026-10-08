import { describe, it, expect } from "vitest";
import { getLastNDays } from "../logic.js";

describe("getLastNDays", () => {
  it("returns 7 days ending today, oldest first, with weekday letters", () => {
    const days = getLastNDays("2026-10-08");
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ dateStr: "2026-10-02", letter: "F" });
    expect(days[6]).toEqual({ dateStr: "2026-10-08", letter: "T" });
  });

  it("crosses month and year boundaries", () => {
    const days = getLastNDays("2027-01-02", 4);
    expect(days.map((d) => d.dateStr)).toEqual(["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
  });

  it("handles leap days", () => {
    expect(getLastNDays("2028-03-01", 2).map((d) => d.dateStr)).toEqual(["2028-02-29", "2028-03-01"]);
  });
});
