import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { Buffer } from "node:buffer";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildFixtures } from "./challengeFixtures.js";
import {
  encodeChallenge, decodeChallenge, challengeLink, resultFromSubmission, mergeReceived,
  validateNickname, displayName, compareResults,
} from "../challenge.js";
import { parseImportJson, buildExportObject } from "../logic.js";

const shared = (name) => fileURLToPath(new URL(`../../../shared/friend-challenges/${name}`, import.meta.url));
const local = (name) => fileURLToPath(new URL(`../${name}`, import.meta.url));

describe("friend challenge shared fixtures", () => {
  const fixtures = buildFixtures();

  it("writes fixtures when asked (npm run fixtures:challenges)", () => {
    if (process.env.GEN_CHALLENGE_FIXTURES) {
      writeFileSync(shared("fixtures.json"), JSON.stringify(fixtures, null, 2) + "\n");
    }
  });

  it("matches the committed fixtures.json", () => {
    const committed = JSON.parse(readFileSync(shared("fixtures.json"), "utf8"));
    expect(JSON.parse(JSON.stringify(fixtures))).toEqual(committed);
  });

  it("word lists in src are identical to shared/", () => {
    for (const f of ["badwords-en.txt", "substring-words.txt"]) {
      expect(readFileSync(local(f), "utf8")).toBe(readFileSync(shared(f), "utf8"));
    }
  });
});

describe("challenge links", () => {
  const result = { d: "2026-11-10", m: "hard", n: "Adam", r: [412, 180, 95, 31, 4], p: 2 };

  it("round-trips", () => {
    const res = decodeChallenge(challengeLink(result));
    expect(res.ok).toBe(true);
    expect(res.challenge).toMatchObject(result);
  });

  it("encodes the documented example exactly", () => {
    const json = '{"v":1,"d":"2026-11-10","m":"hard","n":"Adam","r":[412,180,95,31,4],"p":2}';
    const body = encodeChallenge(result).split(".")[0];
    expect(Buffer.from(body, "base64url").toString("utf8")).toBe(json);
  });

  it("drops an offensive nickname when encoding", () => {
    const res = decodeChallenge(encodeChallenge({ ...result, n: "sh1t" }));
    expect(res.challenge.n).toBeNull();
  });

  it("rejects an edited link", () => {
    const [body, sum] = encodeChallenge(result).split(".");
    const edited = Buffer.from(Buffer.from(body, "base64url").toString().replace('"p":2', '"p":5')).toString("base64url");
    expect(decodeChallenge(`${edited}.${sum}`)).toEqual({ ok: false, error: "checksum" });
  });
});

describe("nicknames", () => {
  it("allows clean names and blocks offensive ones", () => {
    expect(validateNickname("Peacock")).toEqual({ ok: true, value: "Peacock" });
    expect(validateNickname("F.U.C.K").ok).toBe(false);
    expect(displayName("Fuuuck")).toBe("A friend");
  });
});

describe("results from submissions", () => {
  it("converts a full submission and rounds to tenths", () => {
    const sub = { completed: true, date: "2026-11-10", difficulty: "easy", results: [
      { matchPercentage: 41.25, passed: true }, { matchPercentage: 0.04, passed: false }, { matchPercentage: 100, passed: true }] };
    expect(resultFromSubmission(sub, "Adam")).toEqual({ d: "2026-11-10", m: "easy", n: "Adam", r: [413, 0, 1000], p: 2 });
  });

  it("refuses partial or incomplete submissions", () => {
    expect(resultFromSubmission({ completed: true, date: "2026-11-10", difficulty: "hard", results: [{ matchPercentage: 1, passed: true }] })).toBeNull();
    expect(resultFromSubmission({ completed: false, date: "2026-11-10", difficulty: "pro", results: [{ matchPercentage: 1, passed: true }] })).toBeNull();
  });

  it("compares by passes, then average", () => {
    const a = { d: "x", m: "easy", r: [100, 100, 100], p: 2 };
    expect(compareResults(a, { ...a, p: 1 })).toBe("win");
    expect(compareResults(a, { ...a, r: [100, 100, 101] })).toBe("lose");
    expect(compareResults(a, { ...a })).toBe("tie");
  });
});

describe("received challenges storage and export", () => {
  const a = encodeChallenge({ d: "2026-11-10", m: "easy", r: [1, 2, 3], p: 0 });
  const b = encodeChallenge({ d: "2026-11-09", m: "easy", r: [1, 2, 3], p: 0 });

  it("merges, dedupes, sorts newest first, drops invalid", () => {
    expect(mergeReceived([b], [a, b, "junk"])).toEqual([a, b]);
  });

  it("exports and imports the optional challenges list", () => {
    const exported = buildExportObject({}, null, [a]);
    expect(exported.colorSnap.challenges).toEqual([a]);
    const parsed = parseImportJson(JSON.stringify(exported), {});
    expect(parsed.challenges).toEqual([a]);
  });

  it("omits challenges from the export when there are none", () => {
    expect(buildExportObject({}, null, []).colorSnap.challenges).toBeUndefined();
    expect(parseImportJson(JSON.stringify(buildExportObject({}, null)), {}).challenges).toEqual([]);
  });
});
