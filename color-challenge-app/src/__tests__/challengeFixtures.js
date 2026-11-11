/*
 * Builds the shared friend-challenge fixtures from the reference implementation.
 * `npm run fixtures:challenges` writes them to shared/friend-challenges/fixtures.json;
 * challenge.test.js checks the web code still matches the committed file.
 */
import {
  encodeChallenge, decodeChallenge, encodeRawJson, sanitizeNickname, validateNickname,
  isOffensive, displayName, compareResults, challengeState, averageMatch,
} from "../challenge.js";

const raw = (obj) => encodeRawJson(JSON.stringify(obj));

export function buildFixtures() {
  const encodeInputs = [
    { d: "2026-11-10", m: "hard", n: "Adam", r: [412, 180, 95, 31, 4], p: 2 },
    { d: "2026-11-10", m: "easy", r: [823, 741, 669], p: 3 },
    { d: "2026-01-02", m: "pro", n: "José María", r: [1000], p: 1 },
    { d: "2026-12-31", m: "easy", n: "  Ana   O'Neil-Smith_2 ", r: [0, 0, 0], p: 0 },
    { d: "2026-11-10", m: "pro", n: "B1tch", r: [57], p: 1 },
    { d: "2026-11-10", m: "easy", n: "Zoë <script>", r: [500, 20, 999], p: 2 },
    { d: "2026-11-10", m: "hard", n: "abcdefghijklmnopqrstuvwxyz", r: [1, 2, 3, 4, 5], p: 0 },
  ];
  const encode = encodeInputs.map((input) => ({ input, payload: encodeChallenge(input) }));

  const good = encode[0].payload;
  const [body, sum] = good.split(".");
  const decodeInputs = [
    ...encode.map((e) => e.payload),
    `https://colorsnap.app/c/${good}`,
    `https://colorsnap.app/c/${good}?utm_source=x#top`,
    `colorsnap.app/c/${good}/`,
    `${body}.${sum.toUpperCase()}`,
    `${body}.00000000`,
    body,
    "not a link",
    "",
    "@@@.12345678",
    raw({ v: 2, d: "2026-11-10", m: "easy", r: [1, 2, 3], p: 1 }),
    raw({ v: 1, d: "2026-13-10", m: "easy", r: [1, 2, 3], p: 1 }),
    raw({ v: 1, d: "2026-11-10", m: "expert", r: [1, 2, 3], p: 1 }),
    raw({ v: 1, d: "2026-11-10", m: "easy", r: [1, 2], p: 1 }),
    raw({ v: 1, d: "2026-11-10", m: "easy", r: [1, 2, 1001], p: 1 }),
    raw({ v: 1, d: "2026-11-10", m: "easy", r: [1, 2.5, 3], p: 1 }),
    raw({ v: 1, d: "2026-11-10", m: "easy", r: [1, 2, 3], p: 4 }),
    raw({ v: 1, d: "2026-11-10", m: "easy", r: [1, 2, 3], p: -1 }),
    raw({ v: 1, d: "2026-11-10", m: "easy", n: "Fuuuck", r: [1, 2, 3], p: 1 }),
    raw({ v: 1, d: "2026-11-10", m: "easy", n: "Sam!", r: [1, 2, 3], p: 1 }),
    raw({ v: 1, d: "2026-11-10", m: "easy", n: 7, r: [1, 2, 3], p: 1 }),
    raw({ v: 1, d: "2026-11-10", m: "easy", n: "Kai", r: [1, 2, 3], p: 1, extra: true }),
    encodeRawJson("[1,2,3]"),
    encodeRawJson("{not json"),
  ];
  const decode = decodeInputs.map((input) => ({ input, expected: decodeChallenge(input) }));

  const names = [
    "Adam", "", "   ", "José María", "Ana   O'Neil", "Zoë <script>", "😀 Sam", "a".repeat(25),
    "Annalise", "Peacock", "Therapist", "Cocktail", "Scott", "Bob", "Nigeria", "Grape", "Hitchcock",
    "Dick", "fuck", "F.U.C.K", "f u c k", "Fuuuuck", "xxFuckxx", "sh1t", "B1tch", "Bullsh1t",
    "big tits", "Asss", "Scunthorpe", "c0ck", "Twat", "Rape", "Two Girls One Cup",
  ];
  const nicknames = names.map((input) => ({
    input,
    sanitized: sanitizeNickname(input),
    offensive: isOffensive(sanitizeNickname(input)),
    validation: validateNickname(input),
    display: displayName(input),
  }));

  const R = (d, m, r, p) => ({ d, m, r, p });
  const comparePairs = [
    [R("2026-11-10", "hard", [412, 180, 95, 31, 4], 2), R("2026-11-10", "hard", [500, 300, 20, 10, 0], 1)],
    [R("2026-11-10", "hard", [412, 180, 95, 31, 4], 2), R("2026-11-10", "hard", [412, 180, 95, 31, 5], 2)],
    [R("2026-11-10", "easy", [600, 600, 600], 3), R("2026-11-10", "easy", [900, 450, 450], 3)],
    [R("2026-11-10", "easy", [600, 600, 600], 3), R("2026-11-10", "hard", [600, 600, 600, 600, 600], 5)],
    [R("2026-11-10", "pro", [400], 1), R("2026-11-09", "pro", [900], 1)],
    [R("2026-11-10", "pro", [0], 0), R("2026-11-10", "pro", [10], 0)],
  ];
  const compare = comparePairs.map(([mine, theirs]) => ({
    mine, theirs, outcome: compareResults(mine, theirs), mineAverage: averageMatch(mine.r), theirAverage: averageMatch(theirs.r),
  }));

  const sub = (date, difficulty, pcts, passes, completed = true) => ({
    date, difficulty, completed, passCount: passes.filter(Boolean).length,
    results: pcts.map((matchPercentage, i) => ({ matchPercentage, passed: passes[i] })),
  });
  const subs = {
    "2026-11-09": sub("2026-11-09", "hard", [41.24, 18.05, 9.5, 3.1, 0.44], [true, true, true, false, false]),
    "2026-11-08": sub("2026-11-08", "easy", [50, 50], [true, true]),
    "2026-11-07": sub("2026-11-07", "pro", [12.3], [true], false),
  };
  const ch = (d, m) => ({ d, m, r: m === "hard" ? [100, 100, 100, 100, 100] : m === "easy" ? [100, 100, 100] : [100], p: 1 });
  const stateCases = [
    { challenge: ch("2026-11-09", "hard"), today: "2026-11-10" },
    { challenge: ch("2026-11-09", "easy"), today: "2026-11-10" },
    { challenge: ch("2026-11-10", "pro"), today: "2026-11-10" },
    { challenge: ch("2026-11-08", "easy"), today: "2026-11-10" },
    { challenge: ch("2026-11-07", "pro"), today: "2026-11-07" },
    { challenge: ch("2026-11-01", "easy"), today: "2026-11-10" },
  ].map((c) => ({ ...c, expected: challengeState(c.challenge, subs, c.today) }));

  return {
    description: "Shared friend-challenge test cases. Generated by color-challenge-app (npm run fixtures:challenges). See SPEC.md.",
    encode, decode, nicknames, compare,
    state: { submissions: subs, cases: stateCases },
  };
}
