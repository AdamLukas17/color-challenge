/*
 * Builds the shared friend-leaderboard fixtures from the reference implementation.
 * `npm run fixtures:leaderboard` writes them to shared/friend-leaderboard/fixtures.json;
 * leaderboard.test.js checks the web code still matches the committed file.
 *
 * Dates are fixed (today = 2026-11-20) so the fixtures never depend on the clock.
 */
import { encodeChallenge, decodeChallenge, encodeRawJson, storeReceived, isFriendId } from "../challenge.js";
import { buildLeaderboard, removeFriend } from "../leaderboard.js";

const TODAY = "2026-11-20";
const ME = "me00000000";
const SAM = "sam0000001";
const SAM2 = "sam0000002";
const JO = "jo00000001";

const link = (d, m, n, i, r, p) => encodeChallenge({ d, m, ...(n ? { n } : {}), ...(i ? { i } : {}), r, p });
const sub = (d, m, r, passedCount) => ({
  completed: true, date: d, difficulty: m, passCount: passedCount,
  results: r.map((x, k) => ({ matchPercentage: x / 10, passed: k < passedCount })),
});

export function buildFixtures() {
  const encodeInputs = [
    { d: "2026-11-16", m: "easy", n: "Sam", i: SAM, r: [182, 96, 41], p: 2 },
    { d: "2026-11-16", m: "pro", i: SAM, r: [57], p: 1 },
    { d: "2026-11-16", m: "easy", n: "Sam", i: "BAD-ID", r: [1, 2, 3], p: 0 },
    { d: "2026-11-16", m: "easy", n: "Sam", i: "short", r: [1, 2, 3], p: 0 },
  ];
  const encode = encodeInputs.map((input) => ({ input, payload: encodeChallenge(input) }));

  const raw = (obj) => encodeRawJson(JSON.stringify(obj));
  const decodeInputs = [
    encode[0].payload,
    encode[1].payload,
    raw({ v: 1, d: "2026-11-16", m: "easy", n: "Sam", i: "UPPERCASE1", r: [1, 2, 3], p: 0 }),
    raw({ v: 1, d: "2026-11-16", m: "easy", n: "Sam", i: 1234567890, r: [1, 2, 3], p: 0 }),
    raw({ v: 1, d: "2026-11-16", m: "easy", n: "Sam", i: "abcdefghijk", r: [1, 2, 3], p: 0 }),
  ];
  const decode = decodeInputs.map((input) => ({ input, expected: decodeChallenge(input) }));

  const friendIds = ["abc123xyz0", "0000000000", "ABC123XYZ0", "abc123xyz", "abc123xyz01", "abc-23xyz0", "", "ab c3xyz01"]
    .map((input) => ({ input, valid: isFriendId(input) }));

  // A history covering every rule in SPEC "Building the leaderboard".
  const submissions = {
    "2026-11-19": sub("2026-11-19", "easy", [300, 200, 100], 2),
    "2026-11-18": sub("2026-11-18", "hard", [100, 100, 100, 100, 100], 3),
    "2026-11-17": sub("2026-11-17", "easy", [50, 50, 50], 1),
    "2026-11-15": sub("2026-11-15", "easy", [200, 200, 200], 3),
    "2026-10-01": sub("2026-10-01", "easy", [100, 100, 100], 1),
  };
  const received = [
    link("2026-11-20", "easy", "Sam", SAM, [500, 400, 300], 3),       // today, not played: pending
    link("2026-11-19", "easy", "Sam", SAM, [100, 100, 100], 2),       // I win (same passes, higher sum)
    link("2026-11-19", "easy", "Sam", SAM, [900, 900, 900], 3),       // older copy for the same day: ignored
    link("2026-11-18", "easy", "Samuel", SAM, [100, 100, 100], 3),    // different difficulty; older name
    link("2026-11-17", "easy", "Sam", null, [50, 50, 50], 1),         // 2.1 link: joins SAM by nickname -> tie
    link("2026-11-15", "easy", "Jo", JO, [300, 300, 300], 3),         // Jo wins
    link("2026-11-19", "easy", "Kai", null, [10, 10, 10], 0),         // nickname-only friend, I win
    link("2026-11-19", "easy", "Kai", null, [10, 10, 10], 0),         // exact duplicate
    link("2026-11-19", "easy", null, null, [10, 10, 10], 0),          // no name, no ID: left out
    link("2026-11-19", "easy", "Me", ME, [10, 10, 10], 0),            // my own link: left out
    link("2026-11-12", "easy", "Ana", "ana0000001", [10, 10, 10], 0), // only pending (I didn't play)
    link("2026-11-19", "easy", "Twin", "twin000001", [10, 10, 10], 0),
    link("2026-11-19", "easy", "Twin", "twin000002", [20, 20, 20], 0),
    link("2026-11-16", "easy", "Twin", null, [30, 30, 30], 0),        // nickname used by two IDs: own row
    link("2026-10-01", "easy", "Old", "old0000001", [100, 100, 100], 1), // old game: tie, kept forever
    "garbage",
  ];
  const leaderboard = [
    { name: "full history", payloads: received, submissions, myId: ME, expected: buildLeaderboard(received, submissions, { myId: ME }) },
    { name: "no submissions", payloads: received.slice(0, 6), submissions: {}, myId: null, expected: buildLeaderboard(received.slice(0, 6), {}, { myId: null }) },
    { name: "empty", payloads: [], submissions, myId: ME, expected: buildLeaderboard([], submissions, { myId: ME }) },
    {
      name: "two Sams with different IDs stay apart",
      payloads: [link("2026-11-19", "easy", "Sam", SAM, [1, 1, 1], 0), link("2026-11-19", "easy", "Sam", SAM2, [2, 2, 2], 0)],
      submissions, myId: ME,
      expected: buildLeaderboard([link("2026-11-19", "easy", "Sam", SAM, [1, 1, 1], 0), link("2026-11-19", "easy", "Sam", SAM2, [2, 2, 2], 0)], submissions, { myId: ME }),
    },
  ];

  // Storage: games kept forever, unplayed links dropped after 30 days.
  const storeInput = [
    link("2026-10-21", "easy", "Ana", "ana0000001", [1, 1, 1], 0), // exactly 30 days before today: kept
    link("2026-10-20", "easy", "Ana", "ana0000001", [1, 1, 1], 0), // 31 days, unplayed: dropped
    link("2026-10-01", "easy", "Old", "old0000001", [1, 1, 1], 0), // old but played: kept
    link("2026-11-19", "easy", "Sam", SAM, [1, 1, 1], 0),
    link("2026-11-19", "easy", "Sam", SAM, [1, 1, 1], 0),           // duplicate
    "garbage",
  ];
  const store = [
    { input: storeInput, submissions, today: TODAY, expected: storeReceived(storeInput, { submissions, today: TODAY }) },
    { input: storeInput, submissions: {}, today: null, expected: storeReceived(storeInput, {}) },
  ];

  const remove = ["id:" + SAM, "name:Kai", "name:Twin", "id:nobody0000"].map((key) => ({
    payloads: received, key, myId: ME, expected: removeFriend(received, key, { myId: ME }),
  }));

  return {
    description: "Shared friend-leaderboard test cases (see SPEC.md). Generated by the web tests: npm run fixtures:leaderboard. Today is fixed at " + TODAY + ".",
    today: TODAY,
    encode, decode, friendIds, leaderboard, store, remove,
  };
}
