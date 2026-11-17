/*
 * Friend leaderboard: reference implementation of shared/friend-leaderboard/SPEC.md.
 *
 * Built only from received challenge links and my own submissions; nothing is
 * stored besides the links. Android (FriendLeaderboard.kt) and iOS
 * (FriendLeaderboard.swift) must give the same answers;
 * shared/friend-leaderboard/fixtures.json is checked on all three platforms.
 */
import { decodeChallenge, resultFromSubmission, compareResults, isFriendId, DEFAULT_FRIEND_NAME } from "./challenge.js";

const ID_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * New random friend ID: 10 characters of 0-9a-z from a secure generator.
 * Uses rejection sampling so every character is equally likely.
 */
export function newFriendId(randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n))) {
  let id = "";
  while (id.length < 10) {
    for (const b of randomBytes(16)) {
      if (b < 252 && id.length < 10) id += ID_CHARS[b % 36]; // 252 = 7 * 36
    }
  }
  return id;
}

/** Plain code-point order, the same on every platform (no locale rules). */
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Group received links into friends (SPEC "Building the leaderboard", step 1).
 * Returns a Map key -> challenges (in stored order, newest received first).
 * Keys: "id:<friendId>" or "name:<display nickname>".
 */
export function groupFriends(payloads, myId = null) {
  const decoded = [];
  for (const p of payloads || []) {
    const res = decodeChallenge(p);
    if (!res.ok) continue;
    const c = res.challenge;
    if (c.i && c.i === myId) continue; // my own link
    if (!c.i && !c.n) continue; // "A friend" with no ID: can't be told apart
    decoded.push(c);
  }
  // Nicknames each ID group has used.
  const namesById = new Map();
  for (const c of decoded) {
    if (!c.i || !c.n) continue;
    if (!namesById.has(c.i)) namesById.set(c.i, new Set());
    namesById.get(c.i).add(c.n);
  }
  const keyFor = (c) => {
    if (c.i) return `id:${c.i}`;
    const owners = [...namesById.entries()].filter(([, names]) => names.has(c.n)).map(([id]) => id);
    return owners.length === 1 ? `id:${owners[0]}` : `name:${c.n}`;
  };
  const groups = new Map();
  for (const c of decoded) {
    const k = keyFor(c);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  }
  return groups;
}

/**
 * The leaderboard.
 * Returns {
 *   overall: { w, l, t, played },
 *   friends: [{ key, name, w, l, t, played, lastPlayed, lastReceived, leader,
 *               games: [{ d, outcome, mine, theirs }], pending: [{ d, m, r, p, payload }] }]
 * }
 * leader: "me" | "them" | "tied". games and pending are newest day first.
 */
export function buildLeaderboard(payloads, submissions, { myId = null } = {}) {
  const friends = [];
  for (const [key, list] of groupFriends(payloads, myId)) {
    // One result per friend per day: the newest received (first in stored order).
    const byDay = new Map();
    for (const c of list) if (!byDay.has(c.d)) byDay.set(c.d, c);
    const days = [...byDay.keys()].sort((a, b) => cmp(b, a));

    // Name: from the friend's newest link (latest day; first received on ties).
    let nameLink = null;
    for (const c of list) {
      if (c.n && (!nameLink || c.d > nameLink.d)) nameLink = c;
    }
    const name = nameLink ? nameLink.n : DEFAULT_FRIEND_NAME;

    const games = [];
    const pending = [];
    let w = 0, l = 0, t = 0;
    for (const d of days) {
      const theirs = byDay.get(d);
      const mine = resultFromSubmission(submissions?.[d], "");
      const strip = (x) => ({ m: x.m, r: x.r, p: x.p });
      if (!mine) {
        pending.push({ d, ...strip(theirs), payload: theirs.payload });
        continue;
      }
      const outcome = compareResults(mine, theirs);
      if (outcome === "win") w++;
      else if (outcome === "lose") l++;
      else if (outcome === "tie") t++;
      games.push({ d, outcome, mine: strip(mine), theirs: strip(theirs) });
    }
    friends.push({
      key, name, w, l, t,
      played: games.length,
      lastPlayed: games.length ? games[0].d : null,
      lastReceived: days[0],
      leader: w > l ? "me" : l > w ? "them" : "tied",
      games, pending,
    });
  }
  // Most recent first: newest day played together; friends with no games yet
  // after them by their newest link; then name, then key.
  friends.sort((a, b) => {
    if (a.lastPlayed && b.lastPlayed && a.lastPlayed !== b.lastPlayed) return cmp(b.lastPlayed, a.lastPlayed);
    if (!!a.lastPlayed !== !!b.lastPlayed) return a.lastPlayed ? -1 : 1;
    if (!a.lastPlayed && a.lastReceived !== b.lastReceived) return cmp(b.lastReceived, a.lastReceived);
    return cmp(a.name.toLowerCase(), b.name.toLowerCase()) || cmp(a.key, b.key);
  });
  const overall = friends.reduce(
    (acc, f) => ({ w: acc.w + f.w, l: acc.l + f.l, t: acc.t + f.t, played: acc.played + f.played }),
    { w: 0, l: 0, t: 0, played: 0 },
  );
  return { overall, friends };
}

/**
 * Remove a friend: every stored link that groups under `key` (SPEC "Deleting a
 * friend"). Links that don't decode or don't belong to anyone are kept as is.
 */
export function removeFriend(payloads, key, { myId = null } = {}) {
  const group = groupFriends(payloads, myId).get(key) || [];
  const drop = new Set(group.map((c) => c.payload));
  return (payloads || []).filter((p) => {
    const res = decodeChallenge(p);
    return !(res.ok && drop.has(res.challenge.payload));
  });
}

export { isFriendId };
