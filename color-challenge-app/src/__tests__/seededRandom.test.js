import { describe, it, expect } from "vitest";
import { seededRandom } from "../logic.js";

describe("seededRandom", () => {
  it("returns a function", () => {
    const rng = seededRandom("test");
    expect(typeof rng).toBe("function");
  });

  it("produces values between 0 and 1", () => {
    const rng = seededRandom("test-seed");
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic — same seed produces same sequence", () => {
    const rng1 = seededRandom("hello");
    const rng2 = seededRandom("hello");
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("different seeds produce different sequences", () => {
    const rng1 = seededRandom("seed-a");
    const rng2 = seededRandom("seed-b");
    const seq1 = Array.from({ length: 5 }, () => rng1());
    const seq2 = Array.from({ length: 5 }, () => rng2());
    // At least one value should differ
    const allSame = seq1.every((v, i) => v === seq2[i]);
    expect(allSame).toBe(false);
  });

  it("uses the month seed format correctly", () => {
    const rng = seededRandom("2026-04-colorchallenge-monthly-v1");
    const v1 = rng();
    const v2 = rng();
    expect(v1).not.toBe(v2);
    expect(v1).toBeGreaterThanOrEqual(0);
    expect(v1).toBeLessThan(1);
  });

  it("empty string seed still works", () => {
    const rng = seededRandom("");
    const v = rng();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });
});
