# Friend challenges (Color Snap 2.1)

Share a day's result as a link. A friend who opens it sees the result and can
try to beat it (same date and difficulty, so the same color). No accounts and no
server: the link carries everything, and received links are stored only on the
device.

Web (`color-challenge-app/src/challenge.js`) is the reference implementation.
Android (`com.colorsnap.data.FriendChallenge`) and iOS (`FriendChallenge.swift`)
must match it exactly. `fixtures.json` in this folder is checked by the unit
tests on all three platforms; regenerate it from the web tests
(`npm run fixtures:challenges`) after any change, then copy it to the apps.

Files in this folder (copied into each app, tests keep the copies identical):

| File | Purpose |
|---|---|
| `SPEC.md` | this document |
| `fixtures.json` | shared test cases |
| `badwords-en.txt` | LDNOOBW English list, CC BY 4.0 (emoji entry removed) |
| `substring-words.txt` | entries also matched inside a nickname (generated) |
| `generate_substring_words.py` | regenerates `substring-words.txt` |
| `LICENSE-LDNOOBW.txt` | license for the word list |

## Link

```
https://colorsnap.app/c/<base64url(json)>.<checksum>
```

- `json` is built by hand in this exact form (no spaces, keys in this order,
  `n` omitted when there's no nickname):

  ```
  {"v":1,"d":"2026-11-10","m":"hard","n":"Adam","r":[412,180,95,31,4],"p":2}
  ```

  | Key | Meaning |
  |---|---|
  | `v` | format version, always `1` |
  | `d` | date of the result, `YYYY-MM-DD` (the sender's local date) |
  | `m` | difficulty: `easy` (3 photos), `hard` (5), `pro` (1) |
  | `n` | optional nickname (already sanitized and filtered, so it never needs JSON escaping) |
  | `r` | match per photo in tenths of a percent, integers 0..1000 (41.2% is `412`), in photo order |
  | `p` | number of photos that passed |

- `base64url`: UTF-8 bytes of `json`, URL-safe alphabet (`-` `_`), no `=` padding.
- `checksum`: FNV-1a 32-bit over the UTF-8 bytes of `"cs1:" + json`, as 8
  lowercase hex digits. It only stops casual hand edits; it is not security.
- Only full results can be shared: `r` has exactly the difficulty's photo count.

### Decoding

Accept a full link or just the payload. Take the text after `/c/` if present,
cut at the first `?`, `#` or `/`, split at the last `.`. Errors:

| Error | When |
|---|---|
| `format` | no `.`, bad base64url, bytes not UTF-8, not a JSON object |
| `checksum` | checksum doesn't match the decoded JSON text (compare lowercase) |
| `version` | `v` is not `1` |
| `invalid` | bad date, unknown difficulty, wrong `r` length, `r` values not integers in 0..1000, `p` not an integer in 0..`r.length` |

Unknown extra keys are ignored. A valid link with a bad nickname is still
valid: the nickname just becomes no-name ("A friend"). The decoded payload is
re-formed as `<body>.<lowercase checksum>` and used as the challenge's ID.

## Nickname

Set once in Settings, optional. Shown in links as "A friend" when empty.

- Sanitize: remove every character that isn't a Unicode letter, Unicode
  digit, space, `'`, `-`, `.` or `_`; collapse whitespace runs to one space;
  trim; keep the first 20 characters (Unicode code points); trim again.
- Save: an empty result means "no nickname" and is allowed; an offensive one is
  refused with "Please choose a different nickname".
- Display a received `n`: show "A friend" unless `n` is unchanged by
  sanitizing and not offensive.

### Nickname filter

Normalize: lowercase; map `0→o 1→i 3→e 4→a 5→s 7→t 8→b @→a $→s !→i |→i +→t`;
every character not `a`-`z` becomes a space; collapse spaces; trim. Call this
`spaced`; `compact` is `spaced` without spaces; `dedupe(x)` collapses runs of
the same letter (`fuuuck` → `fuck`).

Entries of `badwords-en.txt` are normalized the same way (skip `#` lines and
lines that normalize to nothing). A name is offensive if:

1. `compact`, or any word of `spaced`, equals an entry's compact form; or, when
   that word changes under `dedupe`, `dedupe(word)` equals `dedupe(entry)`;
2. a multi-word entry appears in `spaced` as whole words; or
3. `compact` contains a line of `substring-words.txt`; or, when `compact`
   changes under `dedupe`, `dedupe(compact)` contains `dedupe(line)`.

Rule 3 only uses entries that never occur inside an ordinary dictionary word
(plus a few strong words), so "Annalise", "Peacock" or "Therapist" pass.

## Comparing

A result is `{d, m, r, p}`. My result comes from my saved submission for date
`d`: completed, with exactly the difficulty's photo count;
`r[i] = round(matchPercentage * 10)` clamped to 0..1000; `p` = photos passed.

`compare(mine, theirs)`:
1. different `d` → `different-day`
2. different `m` → `different-difficulty`
3. more `p` wins
4. higher sum of `r` wins (same length, so same as higher average)
5. otherwise `tie`

Average shown to users: `round(sum(r) / len(r)) / 10`, written with at most one
decimal and no trailing `.0` (`14.4`, `60`).

## What to offer for a received challenge

`state(challenge, submissions, today)`:

- I have a full result for `challenge.d` → `compare` (with outcome).
- `challenge.d == today` and I haven't completed today → `play`: start today's
  challenge locked to `challenge.m`; when done, show the head-to-head.
- otherwise → `expired` ("This challenge was for Nov 7"). Past days can't be
  played.

If I played `challenge.d` at a different difficulty, the outcome is
`different-difficulty`: show both scores, no winner.

## Storage and UI

- Received links are stored as payload strings, deduplicated by ID, newest
  date first, at most 50. Opening a link adds it.
- Challenge screen: "Friends' challenges" card listing received challenges from
  the last 7 days (name, difficulty, score, and Beat it / You won / They won /
  Tie / Different difficulty / Missed).
- Results screen: "Challenge a friend" shares
  `"Can you beat my Color Snap? <Color> (<Difficulty>): <p>/<n> passed, <avg>% average. <link>"`.
  After a head-to-head, "Send your result back" shares my link the same way.
- Export format (stays version 1): optional `colorSnap.challenges`, an array of
  payload strings. Import merges them (union, drop invalid).
- Links open the app: iOS Universal Links (`/.well-known/apple-app-site-association`,
  Associated Domains `applinks:colorsnap.app`), Android App Links
  (`/.well-known/assetlinks.json`, `autoVerify` intent filter for
  `https://colorsnap.app/c/*`). Without the app, the web route `/c/<payload>`
  shows the challenge, lets the visitor play in the browser, and shows store badges.
