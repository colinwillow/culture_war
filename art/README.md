# Geometry pipeline: two sessions, one repo (Oct 22 2026)

Two Claude sessions work on `main` at once and never edit the same files:

| Session | Owns (only it writes) | Reads |
|---|---|---|
| **Game** (Colin's main chat) | everything in `src/`, `*.html`, `ROADMAP.md`, `docs/`, **`art/REQUESTS.md`** | `art/DELIVERED.md`, `models/gen/` |
| **Geometry worker** | **`models/gen/`**, **`art/DELIVERED.md`**, `art/worker/` (its scripts) | `art/REQUESTS.md`, `art/STYLE.md` |

- The game session writes WHAT it needs in `REQUESTS.md` (ordered, top first). The worker takes the first item with
  no line in `DELIVERED.md`, builds it, and appends a line. Neither ever edits the other's files.
- Both: `git pull --rebase origin main` before work, push to `main`, on a rejected push pull --rebase and retry.
  The worker never runs `npm run bump` (it ships no code); the game session bumps when it wires a piece in.
- STOP: both loops stop at **15:30 UTC Oct 23 2026** (8:30 am Pacific, Colin's usage reset).

## Standing order (Colin, Oct 22): never idle
When every REQUESTS batch is delivered, the worker goes back through everything it has made and does a DETAIL PASS:
silhouette, bevels, bolts, wear, panel lines, crimson team accents, cleaner breakable chunks. Same file, origin, size and
frame, so the game needs no change. Log it in DELIVERED.md as "detail pass N". At the end, start again from the top, and
keep looping until the STOP time. New REQUESTS batches always come first.
