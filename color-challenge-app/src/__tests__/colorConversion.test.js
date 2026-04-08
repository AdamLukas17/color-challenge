import { describe, it, expect } from "vitest";
import { hexToRgb, rgbToHsl, rgbDistance } from "../logic.js";

describe("hexToRgb", () => {
  it("converts pure red", () => {
    expect(hexToRgb("#FF0000")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("converts pure green", () => {
    expect(hexToRgb("#00FF00")).toEqual({ r: 0, g: 255, b: 0 });
  });

  it("converts pure blue", () => {
    expect(hexToRgb("#0000FF")).toEqual({ r: 0, g: 0, b: 255 });
  });

  it("converts black", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("converts white", () => {
    expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("converts lowercase hex", () => {
    expect(hexToRgb("#ff6b6b")).toEqual({ r: 255, g: 107, b: 107 });
  });

  it("converts teal (#2A9D8F)", () => {
    expect(hexToRgb("#2A9D8F")).toEqual({ r: 42, g: 157, b: 143 });
  });
});

describe("rgbToHsl", () => {
  it("converts pure red to h=0, full saturation", () => {
    const hsl = rgbToHsl(255, 0, 0);
    expect(hsl.h).toBeCloseTo(0, 0);
    expect(hsl.s).toBeCloseTo(1, 1);
    expect(hsl.l).toBeCloseTo(0.5, 1);
  });

  it("converts pure green to h=120", () => {
    const hsl = rgbToHsl(0, 255, 0);
    expect(hsl.h).toBeCloseTo(120, 0);
    expect(hsl.s).toBeCloseTo(1, 1);
    expect(hsl.l).toBeCloseTo(0.5, 1);
  });

  it("converts pure blue to h=240", () => {
    const hsl = rgbToHsl(0, 0, 255);
    expect(hsl.h).toBeCloseTo(240, 0);
    expect(hsl.s).toBeCloseTo(1, 1);
    expect(hsl.l).toBeCloseTo(0.5, 1);
  });

  it("converts white to achromatic (s=0, l=1)", () => {
    const hsl = rgbToHsl(255, 255, 255);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(1);
  });

  it("converts black to achromatic (s=0, l=0)", () => {
    const hsl = rgbToHsl(0, 0, 0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(0);
  });

  it("converts mid-gray to achromatic", () => {
    const hsl = rgbToHsl(128, 128, 128);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBeCloseTo(0.502, 2);
  });

  it("converts teal (#2A9D8F) correctly", () => {
    const hsl = rgbToHsl(42, 157, 143);
    expect(hsl.h).toBeGreaterThan(160);
    expect(hsl.h).toBeLessThan(175);
    expect(hsl.s).toBeGreaterThan(0.5);
    expect(hsl.l).toBeGreaterThan(0.3);
    expect(hsl.l).toBeLessThan(0.5);
  });
});

describe("rgbDistance", () => {
  it("distance between same color is 0", () => {
    expect(rgbDistance("#FF0000", "#FF0000")).toBe(0);
  });

  it("distance between black and white is sqrt(3) * 255", () => {
    const d = rgbDistance("#000000", "#FFFFFF");
    expect(d).toBeCloseTo(Math.sqrt(3) * 255, 1);
  });

  it("distance between red and green", () => {
    const d = rgbDistance("#FF0000", "#00FF00");
    expect(d).toBeCloseTo(Math.sqrt(255 * 255 + 255 * 255), 1);
  });

  it("distance is symmetric", () => {
    const d1 = rgbDistance("#E63946", "#2A9D8F");
    const d2 = rgbDistance("#2A9D8F", "#E63946");
    expect(d1).toBe(d2);
  });

  it("similar colors have small distance", () => {
    const d = rgbDistance("#FF0000", "#FF1010");
    expect(d).toBeLessThan(30);
  });

  it("very different colors exceed MIN_CONSECUTIVE_DISTANCE (100)", () => {
    const d = rgbDistance("#FF0000", "#0000FF");
    expect(d).toBeGreaterThan(100);
  });
});
