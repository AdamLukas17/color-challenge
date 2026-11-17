import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildFixtures } from "./leaderboardFixtures.js";
import { newFriendId, buildLeaderboard, removeFriend, isFriendId } from "../leaderboard.js";
import { encodeChallenge, resultFromSubmission } from "../challenge.js";
import { buildExportObject, parseImportJson } from "../logic.js";

const shared = (f) => fileURLToPath(new URL(`../../../shared/friend-leaderboard/${f}`, import.meta.url));

describe("friend leaderboard shared fixtures", () => {
  const fixtures = buildFixtures();

  it("writes fixtures when asked (npm run fixtures:leaderboard)", () => {
    if (process.env.GEN_LEADERBOARD_FIXTURES) {
      writeFileSync(shared("fixtures.json"), JSON.stringify(fixtures, null, 2) + "\n");
    }
  });

  it("matches the committed fixtures.json", () => {
    const committed = JSON.parse(readFileSync(shared("fixtures.json"), "utf8"));
    expect(JSON.parse(JSON.stringify(fixtures))).toEqual(committed);
  });
});

describe("friend ID", () => {
  it("is 10 characters of 0-9a-z", () => {
    for (let k = 0; k < 50; k++) expect(isFriendId(newFriendId())).toBe(true);
  });

  it("skips biased bytes (rejection sampling)", () => {
    let calls = 0;
    const id = newFriendId(() => { calls++; return new Uint8Array(16).fill(calls === 1 ? 255 : 1); });
    expect(id).toBe("1111111111");
    expect(calls).toBe(2);
  });

  it("is added to links made from a submission", () => {
    const sub = { completed: true, difficulty: "pro", date: "2026-11-16", results: [{ matchPercentage: 5.7, passed: true }] };
    const r = resultFromSubmission(sub, "Sam", "abc123xyz0");
    expect(r.i).toBe("abc123xyz0");
    expect(resultFromSubmission(sub, "Sam", "bad").i).toBeUndefined();
  });

  it("travels in export/import", () => {
    const exported = buildExportObject({}, null, [], "abc123xyz0");
    expect(exported.colorSnap.friendId).toBe("abc123xyz0");
    expect(parseImportJson(JSON.stringify(exported), {}).friendId).toBe("abc123xyz0");
    expect(buildExportObject({}, null, []).colorSnap.friendId).toBeUndefined();
  });
});

describe("leaderboard rules", () => {
  const sub = { completed: true, difficulty: "easy", date: "2026-11-19", passCount: 2, results: [10, 10, 10].map((x, k) => ({ matchPercentage: x, passed: k < 2 })) };
  const L = (n, i, r, p, d = "2026-11-19") => encodeChallenge({ d, m: "easy", n, ...(i ? { i } : {}), r, p });

  it("sorts most recent first, unplayed friends last", () => {
    const subs = { "2026-11-19": sub, "2026-11-18": { ...sub, date: "2026-11-18" } };
    const board = buildLeaderboard([
      L("Old", "old0000001", [1, 1, 1], 0, "2026-11-18"),
      L("New", "new0000001", [1, 1, 1], 0, "2026-11-19"),
      L("Waiting", "wait000001", [1, 1, 1], 0, "2026-11-20"),
    ], subs);
    expect(board.friends.map((f) => f.name)).toEqual(["New", "Old", "Waiting"]);
  });

  it("counts different difficulty as played but not in the record", () => {
    const board = buildLeaderboard([encodeChallenge({ d: "2026-11-19", m: "pro", n: "Sam", i: "sam0000001", r: [900], p: 1 })], { "2026-11-19": sub });
    expect(board.friends[0]).toMatchObject({ played: 1, w: 0, l: 0, t: 0, leader: "tied" });
  });

  it("remove deletes the whole group and nothing else", () => {
    const a = L("Sam", "sam0000001", [1, 1, 1], 0);
    const b = L("Sam", null, [1, 1, 1], 0, "2026-11-18");
    const c = L("Jo", "jo00000001", [1, 1, 1], 0);
    expect(removeFriend([a, b, c, "junk"], "id:sam0000001")).toEqual([c, "junk"]);
  });
});
