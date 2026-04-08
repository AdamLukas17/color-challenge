import { describe, it, expect } from "vitest";
import { parseImportJson, buildExportObject } from "../logic.js";

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

function buildExportJson({
  submissions = {},
  shieldedDates = [],
  shieldsRemaining = 0,
  version = 1,
  exportedFrom = "web",
} = {}) {
  return JSON.stringify({
    colorSnap: {
      version,
      exportedAt: "2026-04-07T12:00:00Z",
      exportedFrom,
      submissions,
      shields: { shieldedDates, shieldsRemaining },
    },
  });
}

function exportSub(date, passCount = 2, difficulty = "easy") {
  return {
    completed: true,
    date,
    difficulty,
    passCount,
    results: [
      { matchPercentage: 45.0, passed: true },
      { matchPercentage: 12.0, passed: true },
    ],
  };
}

// ── parseImportJson ─────────────────────────────────────

describe("parseImportJson", () => {
  // ── Valid imports ────────────────────────────────

  it("parses valid export with no existing data", () => {
    const json = buildExportJson({
      submissions: {
        "2026-04-01": exportSub("2026-04-01"),
        "2026-04-02": exportSub("2026-04-02"),
      },
      exportedFrom: "web",
    });
    const result = parseImportJson(json, {});

    expect(result.importedCount).toBe(2);
    expect(result.overlapping).toBe(0);
    expect(result.exportedFrom).toBe("web");
    expect(result.merged["2026-04-01"]).toBeDefined();
    expect(result.merged["2026-04-02"]).toBeDefined();
  });

  it("parses android export", () => {
    const json = buildExportJson({
      submissions: { "2026-04-01": exportSub("2026-04-01") },
      exportedFrom: "android",
    });
    const result = parseImportJson(json, {});
    expect(result.exportedFrom).toBe("android");
  });

  // ── Overlap detection ───────────────────────────

  it("detects overlapping dates correctly", () => {
    const json = buildExportJson({
      submissions: {
        "2026-04-01": exportSub("2026-04-01"),
        "2026-04-02": exportSub("2026-04-02"),
        "2026-04-03": exportSub("2026-04-03"),
      },
    });
    const existing = {
      "2026-04-02": makeSub("2026-04-02"),
      "2026-04-05": makeSub("2026-04-05"),
    };
    const result = parseImportJson(json, existing);

    expect(result.importedCount).toBe(3);
    expect(result.overlapping).toBe(1); // only 2026-04-02
  });

  it("no overlap when dates are disjoint", () => {
    const json = buildExportJson({
      submissions: { "2026-04-01": exportSub("2026-04-01") },
    });
    const existing = { "2026-04-10": makeSub("2026-04-10") };
    const result = parseImportJson(json, existing);
    expect(result.overlapping).toBe(0);
  });

  // ── Merge logic ─────────────────────────────────

  it("imported data with higher passCount wins", () => {
    const json = buildExportJson({
      submissions: { "2026-04-01": exportSub("2026-04-01", 5) },
    });
    const existing = { "2026-04-01": makeSub("2026-04-01", 3) };
    const result = parseImportJson(json, existing);

    expect(result.merged["2026-04-01"].passCount).toBe(5);
  });

  it("local data wins on tie (equal passCount)", () => {
    const json = buildExportJson({
      submissions: { "2026-04-01": exportSub("2026-04-01", 3) },
    });
    const existing = { "2026-04-01": makeSub("2026-04-01", 3) };
    const result = parseImportJson(json, existing);

    // existing wins ties — merged should equal existing
    expect(result.merged["2026-04-01"].difficulty).toBe("easy");
    expect(result.merged["2026-04-01"].passCount).toBe(3);
  });

  it("local data wins when passCount is higher", () => {
    const json = buildExportJson({
      submissions: { "2026-04-01": exportSub("2026-04-01", 2) },
    });
    const existing = { "2026-04-01": makeSub("2026-04-01", 4) };
    const result = parseImportJson(json, existing);

    expect(result.merged["2026-04-01"].passCount).toBe(4);
  });

  it("preserves non-overlapping local data", () => {
    const json = buildExportJson({
      submissions: { "2026-04-01": exportSub("2026-04-01") },
    });
    const existing = { "2026-04-10": makeSub("2026-04-10") };
    const result = parseImportJson(json, existing);

    expect(result.merged["2026-04-01"]).toBeDefined();
    expect(result.merged["2026-04-10"]).toBeDefined();
  });

  // ── Field parsing ───────────────────────────────

  it("imported submissions have correct fields", () => {
    const json = buildExportJson({
      submissions: { "2026-04-01": exportSub("2026-04-01", 2, "hard") },
    });
    const result = parseImportJson(json, {});
    const sub = result.merged["2026-04-01"];

    expect(sub.completed).toBe(true);
    expect(sub.date).toBe("2026-04-01");
    expect(sub.difficulty).toBe("hard");
    expect(sub.passCount).toBe(2);
    expect(sub.results).toHaveLength(2);
    expect(sub.results[0].passed).toBe(true);
    expect(sub.results[0].matchPercentage).toBe(45.0);
  });

  it("missing difficulty defaults to easy", () => {
    const json = buildExportJson({
      submissions: {
        "2026-04-01": {
          completed: true,
          date: "2026-04-01",
          passCount: 1,
          results: [{ matchPercentage: 10.0, passed: true }],
        },
      },
    });
    const result = parseImportJson(json, {});
    expect(result.merged["2026-04-01"].difficulty).toBe("easy");
  });

  it("missing exportedFrom defaults to unknown", () => {
    const json = JSON.stringify({
      colorSnap: {
        version: 1,
        submissions: {},
      },
    });
    const result = parseImportJson(json, {});
    expect(result.exportedFrom).toBe("unknown");
  });

  // ── Invalid date filtering ──────────────────────

  it("filters out invalid date keys", () => {
    const json = buildExportJson({
      submissions: {
        "2026-04-01": exportSub("2026-04-01"),
        "not-a-date": exportSub("not-a-date"),
        "04/01/2026": exportSub("04/01/2026"),
        "2026-4-1": exportSub("2026-4-1"), // not zero-padded
      },
    });
    const result = parseImportJson(json, {});
    expect(result.importedCount).toBe(1);
    expect(result.merged["2026-04-01"]).toBeDefined();
  });

  // ── Invalid files ───────────────────────────────

  it("throws on invalid JSON", () => {
    expect(() => parseImportJson("this is not json", {})).toThrow();
  });

  it("throws on missing colorSnap key", () => {
    expect(() => parseImportJson('{"foo": "bar"}', {})).toThrow("Not a valid");
  });

  it("throws on version 0", () => {
    const json = buildExportJson({ version: 0 });
    expect(() => parseImportJson(json, {})).toThrow("Not a valid");
  });

  it("throws on future version with update message", () => {
    const json = buildExportJson({ version: 2 });
    expect(() => parseImportJson(json, {})).toThrow("newer version");
  });

  // ── Empty submissions ───────────────────────────

  it("empty submissions parses successfully", () => {
    const json = buildExportJson({ submissions: {} });
    const result = parseImportJson(json, {});
    expect(result.importedCount).toBe(0);
  });

  // ── Idempotency ─────────────────────────────────

  it("importing same data twice gives same result", () => {
    const json = buildExportJson({
      submissions: { "2026-04-01": exportSub("2026-04-01", 3) },
    });
    const existing = { "2026-04-01": makeSub("2026-04-01", 3) };

    const result = parseImportJson(json, existing);
    expect(result.overlapping).toBe(1);
    expect(result.merged["2026-04-01"].passCount).toBe(3);
  });
});

// ── buildExportObject ───────────────────────────────────

describe("buildExportObject", () => {
  it("builds valid export structure", () => {
    const subs = {
      "2026-04-01": makeSub("2026-04-01", 3),
    };
    const obj = buildExportObject(subs);

    expect(obj.colorSnap).toBeDefined();
    expect(obj.colorSnap.version).toBe(1);
    expect(obj.colorSnap.exportedFrom).toBe("web");
    expect(obj.colorSnap.submissions["2026-04-01"]).toBeDefined();
    expect(obj.colorSnap.shields).toEqual({ shieldedDates: [], shieldsRemaining: 0 });
  });

  it("includes correct submission fields", () => {
    const subs = {
      "2026-04-01": makeSub("2026-04-01", 2),
    };
    const obj = buildExportObject(subs);
    const sub = obj.colorSnap.submissions["2026-04-01"];

    expect(sub.completed).toBe(true);
    expect(sub.date).toBe("2026-04-01");
    expect(sub.difficulty).toBe("easy");
    expect(sub.passCount).toBe(2);
    expect(sub.results).toHaveLength(2);
  });

  it("strips photo URIs from results", () => {
    const subs = {
      "2026-04-01": {
        ...makeSub("2026-04-01"),
        photoUris: ["content://photo1"],
      },
    };
    const obj = buildExportObject(subs);
    const sub = obj.colorSnap.submissions["2026-04-01"];
    expect(sub.photoUris).toBeUndefined();
  });

  it("exports multiple submissions", () => {
    const subs = {
      "2026-04-01": makeSub("2026-04-01"),
      "2026-04-02": makeSub("2026-04-02"),
      "2026-04-03": makeSub("2026-04-03"),
    };
    const obj = buildExportObject(subs);
    expect(Object.keys(obj.colorSnap.submissions)).toHaveLength(3);
  });

  it("round-trips through parseImportJson", () => {
    const subs = {
      "2026-04-01": makeSub("2026-04-01", 3),
      "2026-04-02": makeSub("2026-04-02", 5),
    };
    const exported = buildExportObject(subs);
    const json = JSON.stringify(exported);
    const result = parseImportJson(json, {});

    expect(result.importedCount).toBe(2);
    expect(result.merged["2026-04-01"].passCount).toBe(3);
    expect(result.merged["2026-04-02"].passCount).toBe(5);
  });

  it("empty submissions produces valid export", () => {
    const obj = buildExportObject({});
    expect(obj.colorSnap.version).toBe(1);
    expect(Object.keys(obj.colorSnap.submissions)).toHaveLength(0);
  });
});
