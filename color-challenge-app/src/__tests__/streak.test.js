import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateStreak } from "../logic.js";

/**
 * calculateStreak uses `new Date()` internally, so we mock it
 * to make tests deterministic. We pin "today" to 2026-04-07.
 */

function makeSub(date, passCount = 3) {
  return {
    completed: true,
    date,
    difficulty: "easy",
    passCount,
    results: Array.from({ length: passCount }, () => ({
      matchPercentage: 50.0,
      passed: true,
    })),
  };
}

describe("calculateStreak", () => {
  beforeEach(() => {
    // Pin "today" to 2026-04-07 at noon local time
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 7, 12, 0, 0)); // month is 0-indexed
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Empty / zero cases ──────────────────────────────

  it("empty submissions returns 0", () => {
    expect(calculateStreak({})).toBe(0);
  });

  it("no completed submissions returns 0", () => {
    const subs = {
      "2026-04-07": { completed: false, passCount: 0, results: [] },
    };
    expect(calculateStreak(subs)).toBe(0);
  });

  // ── Basic streak counting ───────────────────────────

  it("only today completed returns 1", () => {
    const subs = { "2026-04-07": makeSub("2026-04-07") };
    expect(calculateStreak(subs)).toBe(1);
  });

  it("today and yesterday returns 2", () => {
    const subs = {
      "2026-04-07": makeSub("2026-04-07"),
      "2026-04-06": makeSub("2026-04-06"),
    };
    expect(calculateStreak(subs)).toBe(2);
  });

  it("five consecutive days ending today returns 5", () => {
    const subs = {};
    for (let i = 0; i < 5; i++) {
      const d = `2026-04-${String(7 - i).padStart(2, "0")}`;
      subs[d] = makeSub(d);
    }
    expect(calculateStreak(subs)).toBe(5);
  });

  it("streak counts from yesterday if today not completed", () => {
    const subs = {
      "2026-04-06": makeSub("2026-04-06"),
    };
    expect(calculateStreak(subs)).toBe(1);
  });

  it("three consecutive days ending yesterday returns 3", () => {
    const subs = {
      "2026-04-06": makeSub("2026-04-06"),
      "2026-04-05": makeSub("2026-04-05"),
      "2026-04-04": makeSub("2026-04-04"),
    };
    expect(calculateStreak(subs)).toBe(3);
  });

  // ── Gap breaks streak ───────────────────────────────

  it("gap in the middle breaks streak", () => {
    const subs = {
      "2026-04-07": makeSub("2026-04-07"),
      "2026-04-06": makeSub("2026-04-06"),
      // 2026-04-05 missing
      "2026-04-04": makeSub("2026-04-04"),
    };
    expect(calculateStreak(subs)).toBe(2);
  });

  it("isolated old completion does not count", () => {
    const subs = {
      "2026-03-28": makeSub("2026-03-28"),
    };
    expect(calculateStreak(subs)).toBe(0);
  });

  it("two day gap with today completed gives 1", () => {
    const subs = {
      "2026-04-07": makeSub("2026-04-07"),
      "2026-04-04": makeSub("2026-04-04"),
    };
    expect(calculateStreak(subs)).toBe(1);
  });

  // ── Cross-month boundary ────────────────────────────

  it("streak crosses month boundary", () => {
    // Pin to April 2, so streak goes back into March
    vi.setSystemTime(new Date(2026, 3, 2, 12, 0, 0));
    const subs = {
      "2026-04-02": makeSub("2026-04-02"),
      "2026-04-01": makeSub("2026-04-01"),
      "2026-03-31": makeSub("2026-03-31"),
      "2026-03-30": makeSub("2026-03-30"),
    };
    expect(calculateStreak(subs)).toBe(4);
  });

  // ── Edge: today not completed, yesterday not either ─

  it("nothing recent returns 0", () => {
    const subs = {
      "2026-04-01": makeSub("2026-04-01"),
    };
    expect(calculateStreak(subs)).toBe(0);
  });

  // ── Non-completed entries don't count ───────────────

  it("non-completed submissions are skipped", () => {
    const subs = {
      "2026-04-07": { completed: false, date: "2026-04-07", passCount: 0, results: [] },
      "2026-04-06": makeSub("2026-04-06"),
    };
    // Today not completed, skips to yesterday → streak 1
    expect(calculateStreak(subs)).toBe(1);
  });
});
