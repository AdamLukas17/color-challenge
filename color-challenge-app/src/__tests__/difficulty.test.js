import { describe, it, expect } from "vitest";
import { DIFFICULTY, MIN_SATURATION } from "../logic.js";

describe("DIFFICULTY constants", () => {
  it("easy mode has correct tolerances", () => {
    expect(DIFFICULTY.easy.photos).toBe(3);
    expect(DIFFICULTY.easy.hueTolerance).toBe(25);
    expect(DIFFICULTY.easy.satTolerance).toBe(0.55);
    expect(DIFFICULTY.easy.lightTolerance).toBe(0.45);
    expect(DIFFICULTY.easy.threshold).toBe(2);
  });

  it("hard mode has correct tolerances", () => {
    expect(DIFFICULTY.hard.photos).toBe(5);
    expect(DIFFICULTY.hard.hueTolerance).toBe(15);
    expect(DIFFICULTY.hard.satTolerance).toBe(0.35);
    expect(DIFFICULTY.hard.lightTolerance).toBe(0.3);
    expect(DIFFICULTY.hard.threshold).toBe(4);
  });

  it("pro mode has correct tolerances (single photo, tightest)", () => {
    expect(DIFFICULTY.pro.photos).toBe(1);
    expect(DIFFICULTY.pro.hueTolerance).toBe(8);
    expect(DIFFICULTY.pro.satTolerance).toBe(0.2);
    expect(DIFFICULTY.pro.lightTolerance).toBe(0.18);
    expect(DIFFICULTY.pro.threshold).toBe(5);
    expect(DIFFICULTY.pro.label).toBe("Pro");
  });

  it("pro mode is strictly tighter than hard", () => {
    expect(DIFFICULTY.pro.hueTolerance).toBeLessThan(DIFFICULTY.hard.hueTolerance);
    expect(DIFFICULTY.pro.satTolerance).toBeLessThan(DIFFICULTY.hard.satTolerance);
    expect(DIFFICULTY.pro.lightTolerance).toBeLessThan(DIFFICULTY.hard.lightTolerance);
    expect(DIFFICULTY.pro.threshold).toBeGreaterThan(DIFFICULTY.hard.threshold);
    expect(DIFFICULTY.pro.photos).toBeLessThan(DIFFICULTY.hard.photos);
  });

  it("hard mode is strictly tighter than easy", () => {
    expect(DIFFICULTY.hard.hueTolerance).toBeLessThan(DIFFICULTY.easy.hueTolerance);
    expect(DIFFICULTY.hard.satTolerance).toBeLessThan(DIFFICULTY.easy.satTolerance);
    expect(DIFFICULTY.hard.lightTolerance).toBeLessThan(DIFFICULTY.easy.lightTolerance);
    expect(DIFFICULTY.hard.threshold).toBeGreaterThan(DIFFICULTY.easy.threshold);
    expect(DIFFICULTY.hard.photos).toBeGreaterThan(DIFFICULTY.easy.photos);
  });

  it("easy and hard have labels", () => {
    expect(DIFFICULTY.easy.label).toBe("Easy");
    expect(DIFFICULTY.hard.label).toBe("Hard");
  });

  it("MIN_SATURATION is 0.15", () => {
    expect(MIN_SATURATION).toBe(0.15);
  });

  it("tolerances match Android source of truth", () => {
    // These must stay in sync with Android's ChallengeRepository.kt DIFFICULTIES map
    // Easy: hue±25, sat±0.55, light±0.45, threshold 2%
    // Hard: hue±15, sat±0.35, light±0.30, threshold 4%
    expect(DIFFICULTY.easy.hueTolerance).toBe(25);
    expect(DIFFICULTY.easy.satTolerance).toBe(0.55);
    expect(DIFFICULTY.easy.lightTolerance).toBe(0.45);
    expect(DIFFICULTY.easy.threshold).toBe(2);

    expect(DIFFICULTY.hard.hueTolerance).toBe(15);
    expect(DIFFICULTY.hard.satTolerance).toBe(0.35);
    expect(DIFFICULTY.hard.lightTolerance).toBe(0.3);
    expect(DIFFICULTY.hard.threshold).toBe(4);
  });
});
