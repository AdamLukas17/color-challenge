# Friend leaderboard (Color Snap 2.2) — DRAFT v2 for review

See how you stack up against friends, built entirely from the challenge links
people already send each other. No accounts, no server: every phone computes
its own leaderboard from the links it has received. Photos never leave the
device; links carry only scores, a nickname and a random friend ID.

Builds on [friend challenges](../friend-challenges/SPEC.md) (2.1). Web
(`color-challenge-app/src/leaderboard.js`) will be the reference
implementation; Android and iOS must match it, checked against a shared
`fixtures.json` in this folder (same setup as friend challenges).

Decided in review: sort by most recent, all-time records, keep every game
played, friends can be deleted, web gets its own ID, no streak cards.

## What users see

A **Friends** section on the Streak tab (below the shields card), opening a
full Leaderboard screen:

```
FRIENDS                                  You 12 - 7 - 2
---------------------------------------------------------
Sam          9 played    6 - 2 - 1     You lead
Jordan       7 played    3 - 4 - 0     Jordan leads
A. Rivera    3 played    2 - 1 - 1     You lead
---------------------------------------------------------
Days you both played the same difficulty count toward the record.
```

- Each row: friend's name, days you both played, your record against them
  (wins - losses - ties), and who leads.
- Header: your overall record against all friends.
- Tapping a row opens that friend's history: each shared day with both scores,
  newest first, plus their recent results you haven't played.
- Empty state: "Challenge a friend from your results to start a leaderboard."
- **Sort: most recent first**, by the newest day you both played. Friends you
  haven't played with yet (only their challenges received) come after, by
  their newest link. Ties sort by name.
- **Delete a friend:** from their history screen ("Remove Sam") or by swiping
  the row, with a confirmation ("Remove Sam and your 9 games? This can't be
  undone."). See Deleting a friend.

## Friend ID

Each install creates a random ID once and puts it in every link it sends, so
one friend's links group together even if they change their nickname, and two
different "Sam"s stay separate.

- 10 characters from `0-9a-z`, from a secure random generator (~51 bits).
  Created on first use, stored locally (Android DataStore `friend_id`, iOS App
  Group `friend_id`, web `localStorage` `colorSnap.friendId`).
- Not derived from the device, account, Apple/Google IDs or anything personal.
  It only reaches people the user chose to send a link to.
- Settings > Nickname card gets "Reset friend ID" (new ID; friends will see
  you as a new person). Small print explains what it's for.
- Data export (format stays version 1) adds optional `colorSnap.friendId`.
  Import with Replace adopts it (moving to a new phone keeps your identity);
  Merge keeps the local one.

**Web.** Each browser creates its own random ID the first time it shares a
link, stored in `localStorage` next to the rest of the web data. It is never
shared between users. It changes only when:
- the user clears site data (their whole history is gone too, so they start
  over everywhere, and friends see a new person);
- they use a private window (a new ID each private session);
- they use another browser or device without moving their data (Export, then
  Import with Replace, copies the ID).

Someone who plays on both the website and a phone shows up as two friends
unless they transfer data between them.

## Link change

Challenge links gain one optional key, `i`, right after `n` (or after `m` when
there's no nickname):

```
{"v":1,"d":"2026-11-16","m":"easy","n":"Sam","i":"k3v9x0qz2m","r":[182,96,41],"p":2}
```

- `v` stays `1`. The 2.1 decoders ignore unknown keys and check the checksum
  against the received JSON text, so 2.1 apps and the current website accept
  the new links unchanged (they just don't use `i`).
- `i` must be exactly 10 characters of `0-9a-z`; any other value is dropped
  (the link stays valid, just without an ID).
- Canonical order: `v, d, m, n?, i?, r, p`. Fixtures cover links with and
  without `n` and `i`.

## Building the leaderboard

Input: the received challenge links (stored as today) plus my submissions.

1. **Group links into friends.**
   - Skip links whose `i` is my own ID (I opened my own link).
   - Links with an `i` group by `i`.
   - Links without `i` (sent from 2.1) group by display nickname. If exactly
     one ID group has used that nickname, the nickname group joins it;
     otherwise it stays its own row.
   - Links with neither `i` nor a nickname ("A friend") can't be told apart:
     they're left out of the leaderboard (still listed in Friends' challenges).
2. **Name:** the nickname from that friend's newest link.
3. **One result per friend per day.** If a friend sent several links for the
   same day, use the newest received (later attempts replace earlier ones).
4. **Record:** for each of the friend's days, run 2.1 `compare(mine, theirs)`:
   - `win` / `lose` / `tie` count toward the record and "played";
   - `different-difficulty` counts toward "played" only;
   - `different-day` can't happen (same day by construction); no result of
     mine for that day means it isn't shared yet (shown in history, not counted).
5. **Leader:** more wins leads; equal wins is "Tied".

**Time window: all time.** Records never expire.

### Storage

- **Every game is kept.** A received link is a *game* once I have a full
  result for its day (whatever the outcome, including different difficulty).
  Games are never pruned.
- **Unplayed links** (I never played that day) are dropped once they're more
  than 30 days old, so a pile of old challenges doesn't build up.
- This replaces 2.1's cap of 50 links. A safety cap of 10,000 links stays, in
  case something goes wrong; at about 100 bytes each that's under 1 MB, well
  within web `localStorage` limits.
- Nothing else is stored: the leaderboard is recomputed from links and
  submissions, so it can't drift out of sync, and export/import already
  carries it (`colorSnap.challenges`).

### Deleting a friend

- Removes every stored link in that friend's group (all their games and
  pending challenges). Export afterwards no longer contains them.
- It's a delete, not a block: if they send a new link later, they appear again
  as a new row with a fresh record.
- Nickname-only rows (2.1 links without an ID) delete the same way.

## Not planned

Streak cards (sharing your current streak so it shows on friends' boards)
were considered and left out. The leaderboard only uses challenge links.

## Honest limits

- **Not live.** A friend's row only updates when they send a link.
- **Scores can be faked.** The checksum stops typos, not someone determined to
  hand-edit a link. Any secret built into the apps could be extracted, so
  real protection would need a server. Acceptable for a friends-only board:
  you only see links people sent you. Nothing is ranked globally.
- **Nicknames from 2.1 links** may group imperfectly until those friends
  update (their links then carry an ID).

## Privacy

- New data: one random friend ID, stored on the device and included only in
  links the user shares. No photos, no device identifiers, nothing sent
  anywhere automatically.
- App Store privacy label and Play data safety form: unchanged. (The ID is
  user-shared content, not collected by the developer.)

## Work plan (after review)

1. Finalize this spec; generate `fixtures.json` from web tests
   (grouping, nickname merge, one-result-per-day, records, sort order,
   pruning of unplayed links, delete, `i` validation).
2. Web: `leaderboard.js`, friend ID, Friends section, then the apps.
3. Android and iOS: same, one branch and Draft PR each; tests against the
   shared fixtures; foldable two-pane and dark mode checks.
