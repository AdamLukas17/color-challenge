/*
 * Friend challenges: share links, nickname filter, head-to-head comparison.
 *
 * Reference implementation of shared/friend-challenges/SPEC.md. Android
 * (FriendChallenge.kt) and iOS (FriendChallenge.swift) must produce the same
 * links and the same answers; shared/friend-challenges/fixtures.json is checked
 * by the tests on all three platforms.
 */
import { DIFFICULTY } from "./logic.js";
// Copies of shared/friend-challenges/*.txt (a test keeps them identical).
import badWordsText from "./badwords-en.txt?raw";
import substringWordsText from "./substring-words.txt?raw";

export const CHALLENGE_LINK_BASE = "https://colorsnap.app/c/";
/** Friend ID (shared/friend-leaderboard/SPEC.md): 10 characters of 0-9a-z. */
export const FRIEND_ID_RE = /^[0-9a-z]{10}$/;
export const isFriendId = (i) => typeof i === "string" && FRIEND_ID_RE.test(i);
export const DEFAULT_FRIEND_NAME = "A friend";
export const NICKNAME_MAX_LENGTH = 20;

/* ─── Nickname ─── */

const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i", "|": "i", "+": "t" };

/** Lowercase, undo leetspeak, turn everything that isn't a-z into single spaces. */
export function normalizeForFilter(text) {
  let out = "";
  for (const ch of text.toLowerCase()) {
    const c = LEET[ch] ?? ch;
    out += c >= "a" && c <= "z" ? c : " ";
  }
  return out.replace(/ +/g, " ").trim();
}

/** Collapse runs of the same letter ("fuuuck" -> "fuck"). */
const dedupeRuns = (s) => s.replace(/(.)\1+/g, "$1");

const lines = (text) => text.split("\n").filter((l) => l.trim() && !l.startsWith("#"));

function buildFilter(badText, substringText) {
  const words = new Set(); // every entry, normalized with spaces removed
  const wordsDeduped = new Set();
  const phrases = []; // multi-word entries, normalized with single spaces
  for (const line of lines(badText)) {
    const spaced = normalizeForFilter(line);
    if (!spaced) continue;
    const compact = spaced.replace(/ /g, "");
    words.add(compact);
    wordsDeduped.add(dedupeRuns(compact));
    if (spaced.includes(" ")) phrases.push(spaced);
  }
  const substrings = lines(substringText).map((l) => l.trim());
  return { words, wordsDeduped, phrases, substrings };
}

const FILTER = buildFilter(badWordsText, substringWordsText);

const isBadWord = (w) => FILTER.words.has(w) || (dedupeRuns(w) !== w && FILTER.wordsDeduped.has(dedupeRuns(w)));

/**
 * True if the nickname contains a blocked word. See SPEC.md "Nickname filter":
 * (a) any word, or the whole name with spaces removed, is a listed entry
 *     (also after collapsing repeated letters);
 * (b) a listed multi-word phrase appears as whole words;
 * (c) an entry from substring-words.txt appears anywhere.
 */
export function isOffensive(name) {
  const spaced = normalizeForFilter(name);
  if (!spaced) return false;
  const compact = spaced.replace(/ /g, "");
  if (isBadWord(compact) || spaced.split(" ").some(isBadWord)) return true;
  const padded = ` ${spaced} `;
  if (FILTER.phrases.some((ph) => padded.includes(` ${ph} `))) return true;
  // Repeated-letter tricks ("fuuuck") are only checked when the name has
  // repeated letters, so "Niger" doesn't match "nigger".
  const compactDeduped = dedupeRuns(compact);
  const stretched = compactDeduped !== compact;
  return FILTER.substrings.some((s) => compact.includes(s) || (stretched && compactDeduped.includes(dedupeRuns(s))));
}

/**
 * Clean up a typed nickname: trim, collapse whitespace, keep only letters,
 * digits, space and ' - . _ , cut to 20 characters. Returns "" if nothing is left.
 */
export function sanitizeNickname(raw) {
  if (typeof raw !== "string") return "";
  const kept = raw.replace(/[^\p{L}\p{N} '\-._]/gu, "").replace(/\s+/g, " ").trim();
  return Array.from(kept).slice(0, NICKNAME_MAX_LENGTH).join("").trim();
}

/**
 * Validate a nickname for saving. Returns { ok: true, value } or
 * { ok: false, reason: "empty" | "offensive" }. An empty nickname is allowed
 * to be saved as "no nickname" by the caller.
 */
export function validateNickname(raw) {
  const value = sanitizeNickname(raw);
  if (!value) return { ok: false, reason: "empty", value: "" };
  if (isOffensive(value)) return { ok: false, reason: "offensive", value };
  return { ok: true, value };
}

/** Name to show for a received challenge. */
export function displayName(n) {
  if (typeof n !== "string") return DEFAULT_FRIEND_NAME;
  const clean = sanitizeNickname(n);
  if (!clean || clean !== n || isOffensive(clean)) return DEFAULT_FRIEND_NAME;
  return clean;
}

/* ─── Link encoding ─── */

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(str)) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export const checksum = (json) => fnv1a("cs1:" + json);

function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(s) {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) throw new Error("bad base64");
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/**
 * Canonical JSON, built by hand so every platform produces identical bytes.
 * Key order: v, d, m, n?, i?, r, p (`i` is the 2.2 friend ID; 2.1 decoders ignore it).
 */
export function canonicalJson({ d, m, n, i, r, p }) {
  const name = n ? `"n":"${n}",` : "";
  const id = isFriendId(i) ? `"i":"${i}",` : "";
  return `{"v":1,"d":"${d}","m":"${m}",${name}${id}"r":[${r.join(",")}],"p":${p}}`;
}

/**
 * Build the payload ("<base64url json>.<checksum>") for a result.
 * result: { d: "YYYY-MM-DD", m: "easy"|"hard"|"pro", n?: nickname, r: [tenths], p: passed }
 */
export function encodeChallenge(result) {
  const n = result.n ? sanitizeNickname(result.n) : "";
  const json = canonicalJson({ ...result, n: n && !isOffensive(n) ? n : "" });
  return `${base64UrlEncode(json)}.${checksum(json)}`;
}

export const challengeLink = (result) => CHALLENGE_LINK_BASE + encodeChallenge(result);

/** Payload for arbitrary JSON text (used to build malformed test fixtures). */
export const encodeRawJson = (json) => `${base64UrlEncode(json)}.${checksum(json)}`;

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Parse a payload or full link. Returns { ok: true, challenge } or
 * { ok: false, error } with error one of: "format", "checksum", "version", "invalid".
 * challenge: { d, m, n (display-safe name or null), r, p, payload }
 */
export function decodeChallenge(input) {
  if (typeof input !== "string") return { ok: false, error: "format" };
  let payload = input.trim();
  const at = payload.indexOf("/c/");
  if (at >= 0) payload = payload.slice(at + 3);
  payload = payload.split(/[?#/]/)[0];
  const dot = payload.lastIndexOf(".");
  if (dot <= 0) return { ok: false, error: "format" };
  const body = payload.slice(0, dot);
  const sum = payload.slice(dot + 1);
  let json;
  try { json = base64UrlDecode(body); } catch { return { ok: false, error: "format" }; }
  if (checksum(json) !== sum.toLowerCase()) return { ok: false, error: "checksum" };
  let o;
  try { o = JSON.parse(json); } catch { return { ok: false, error: "format" }; }
  if (!o || typeof o !== "object" || Array.isArray(o)) return { ok: false, error: "format" };
  if (o.v !== 1) return { ok: false, error: "version" };
  const diff = DIFFICULTY[o.m];
  if (typeof o.d !== "string" || !DATE_RE.test(o.d) || !diff) return { ok: false, error: "invalid" };
  if (!Array.isArray(o.r) || o.r.length !== diff.photos) return { ok: false, error: "invalid" };
  if (!o.r.every((x) => Number.isInteger(x) && x >= 0 && x <= 1000)) return { ok: false, error: "invalid" };
  if (!Number.isInteger(o.p) || o.p < 0 || o.p > o.r.length) return { ok: false, error: "invalid" };
  const name = o.n === undefined ? null : displayName(o.n);
  const challenge = { d: o.d, m: o.m, n: name === DEFAULT_FRIEND_NAME ? null : name, r: o.r, p: o.p, payload: `${body}.${sum.toLowerCase()}` };
  // Friend ID (2.2): only a well-formed one is kept; anything else is ignored.
  if (isFriendId(o.i)) challenge.i = o.i;
  return { ok: true, challenge };
}

/* ─── Results ─── */

/**
 * Turn a local completed submission into a challenge result, or null if it
 * can't be shared. `friendId` (optional) is added as `i`.
 */
export function resultFromSubmission(sub, nickname, friendId) {
  if (!sub || !sub.completed || !DIFFICULTY[sub.difficulty]) return null;
  const results = sub.results || [];
  if (results.length !== DIFFICULTY[sub.difficulty].photos) return null;
  return {
    d: sub.date,
    m: sub.difficulty,
    n: nickname || "",
    r: results.map((x) => Math.min(1000, Math.max(0, Math.round((Number(x.matchPercentage) || 0) * 10)))),
    p: results.filter((x) => x.passed).length,
    ...(isFriendId(friendId) ? { i: friendId } : {}),
  };
}

/** Average match % with one decimal, from tenths. */
export const averageMatch = (r) => (r.length ? Math.round(r.reduce((a, b) => a + b, 0) / r.length) / 10 : 0);

/**
 * Compare my result with a friend's.
 * Returns "win" | "lose" | "tie" | "different-difficulty" | "different-day".
 * Rule: more photos passed wins; tie-break is the higher average match.
 */
export function compareResults(mine, theirs) {
  if (mine.d !== theirs.d) return "different-day";
  if (mine.m !== theirs.m) return "different-difficulty";
  if (mine.p !== theirs.p) return mine.p > theirs.p ? "win" : "lose";
  const a = mine.r.reduce((x, y) => x + y, 0);
  const b = theirs.r.reduce((x, y) => x + y, 0);
  if (a !== b) return a > b ? "win" : "lose";
  return "tie";
}

/**
 * What the app should offer for a received challenge, given my submissions and today's date.
 * Returns one of:
 *   { state: "compare", outcome, mine }      I have a result for that date
 *   { state: "play" }                        it's for today and I haven't played: play at challenge.m
 *   { state: "expired" }                     it's for another day and I didn't play then
 */
export function challengeState(challenge, submissions, todayStr, nickname = "") {
  const mine = resultFromSubmission(submissions?.[challenge.d], nickname);
  if (mine) return { state: "compare", outcome: compareResults(mine, challenge), mine };
  if (challenge.d === todayStr && !submissions?.[challenge.d]?.completed) return { state: "play" };
  return { state: "expired" };
}

/** Unplayed received links are dropped once they're this many days old. */
export const UNPLAYED_KEEP_DAYS = 30;
/** Safety cap on stored links (about 1 MB). */
export const MAX_RECEIVED = 10000;

/** `YYYY-MM-DD` minus `days`, computed in UTC so it never depends on the time zone. */
export function addDays(dateStr, days) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d + days));
  return t.toISOString().slice(0, 10);
}

/**
 * Store received payloads (shared/friend-leaderboard/SPEC.md "Storage").
 * `payloads` is in received order, newest first; the result keeps that order.
 * Drops invalid and duplicate links (the first copy wins), then unplayed links
 * (I have no full result for their day) more than UNPLAYED_KEEP_DAYS before
 * `today`, then anything past MAX_RECEIVED. Games are never dropped otherwise.
 * Without `today`, nothing is pruned by age.
 */
export function storeReceived(payloads, { submissions = {}, today = null } = {}) {
  const cutoff = today ? addDays(today, -UNPLAYED_KEEP_DAYS) : null;
  const seen = new Set();
  const out = [];
  for (const p of payloads || []) {
    const res = decodeChallenge(p);
    if (!res.ok || seen.has(res.challenge.payload)) continue;
    seen.add(res.challenge.payload);
    const c = res.challenge;
    const played = !!resultFromSubmission(submissions?.[c.d], "");
    if (cutoff && !played && c.d < cutoff) continue;
    out.push(c.payload);
    if (out.length >= MAX_RECEIVED) break;
  }
  return out;
}
