import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLocalDateStr, getTimeRemaining } from "../logic.js";

describe("getLocalDateStr", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats as YYYY-MM-DD", () => {
    vi.setSystemTime(new Date(2026, 3, 7, 12, 0, 0)); // April 7
    expect(getLocalDateStr()).toBe("2026-04-07");
  });

  it("zero-pads single digit month", () => {
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0)); // January 15
    expect(getLocalDateStr()).toBe("2026-01-15");
  });

  it("zero-pads single digit day", () => {
    vi.setSystemTime(new Date(2026, 11, 5, 12, 0, 0)); // December 5
    expect(getLocalDateStr()).toBe("2026-12-05");
  });

  it("handles leap year Feb 29", () => {
    vi.setSystemTime(new Date(2028, 1, 29, 12, 0, 0)); // Feb 29 2028
    expect(getLocalDateStr()).toBe("2028-02-29");
  });

  it("handles year boundaries", () => {
    vi.setSystemTime(new Date(2025, 11, 31, 23, 59, 0)); // Dec 31 2025
    expect(getLocalDateStr()).toBe("2025-12-31");

    vi.setSystemTime(new Date(2026, 0, 1, 0, 0, 0)); // Jan 1 2026
    expect(getLocalDateStr()).toBe("2026-01-01");
  });
});

describe("getTimeRemaining", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns HH:MM:SS format", () => {
    vi.setSystemTime(new Date(2026, 3, 7, 12, 0, 0));
    const remaining = getTimeRemaining();
    expect(remaining).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("returns 12:00:00 at noon", () => {
    vi.setSystemTime(new Date(2026, 3, 7, 12, 0, 0));
    expect(getTimeRemaining()).toBe("12:00:00");
  });

  it("returns 00:00:01 one second before midnight", () => {
    vi.setSystemTime(new Date(2026, 3, 7, 23, 59, 59));
    expect(getTimeRemaining()).toBe("00:00:01");
  });

  it("returns 23:59:59 one second after midnight", () => {
    vi.setSystemTime(new Date(2026, 3, 7, 0, 0, 1));
    expect(getTimeRemaining()).toBe("23:59:59");
  });
});
