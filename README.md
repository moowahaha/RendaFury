# Renda Fury

A **strictly 2-player** Japanese / Street-Fighter-flavoured button-fighting game for the
**Mebobox** console (by Mebobox), built on the **Mebobox SDK**. Two players duel across a
best-of-N series of sets; each set mixes **memory duels** with a **button-bash** decider.

Pure static HTML/CSS/JS (ES modules) — no build step, no framework, fully testable in a browser.

> *Renda* (連打) — "rapid-fire button mashing." This is a head-to-head reflex-and-memory duel: no
> AI opponent, no single-player mode. Grab a friend (or a second controller) and fight.

## Publishing to the Library

This repo is the **source** of the game. It is published to the **Mebobox Library** through the
Mebobox Creator Hub — there is no `manifest.json` here any more; the game's details are entered in
the UI when you upload it.

1. Sign in at **mebobox.com/library** → **Creator Hub** → **Upload a game**.
2. **Source** (step *Upload*): either upload a **zip of this repo**, or point the Library at this
   public GitHub repository (and pick a branch/tag).
3. **Details** to enter (step *Information*):

   | Field        | Value |
   |--------------|-------|
   | **Name**     | Renda Fury |
   | **Description** | A two-player Japanese button-fighting showdown — memory duels and furious button-mashing across best-of-N sets. |
   | **Players**  | Multiplayer (strictly 2-player) |
   | **Cover art** | `assets/cover.png` — upload this as the cover in the modal (optional, ≤2 MB; square works best) |

4. Tick the consent checkboxes and submit. The Library runs its automatic checks and notifies you of
   the result; on success the game is playable on a Mebobox by its 6-letter code.

The game ships its licence as the [`LICENSE`](./LICENSE) file (Mebobox Commercial Licence).

## The game at a glance

A **match** is a best-of-3, -5, or -7 series of **sets**. The first player to win
`ceil(totalSets/2)` sets takes the match.

Each **set** is played at a random Japanese **location** and is up to three games:

1. **Memory duel** (game 1) — the console flashes a button sequence on both pads, then hides it.
   Both players race to reproduce it from memory. First to complete it correctly wins; a wrong
   press resets that player's progress. Nobody finishes cleanly within 5 s → **draw**.
2. **Memory duel** (game 2) — same again.
3. **Button bash** (game 3, only if the memory games are level) — the game picks two buttons; each
   player must press them **alternately** (e.g. ▲, B, ▲, B, …) as fast as they can for 5 s. Most
   correct alternating presses wins. Pressing the same button twice doesn't score. A dead heat goes
   to **sudden death** — next correct alternation wins — so a set is always decisive.

If the two memory games aren't level, the set goes to whoever won more of them.

### Difficulty

Difficulty sets the memory sequence **length** and **speed**:

| Belt        | Sequence length | Speed  |
|-------------|-----------------|--------|
| White Belt  | 3 buttons       | Slow   |
| Black Belt  | 5 buttons       | Medium |
| Furious     | 6 buttons       | Fast   |

Every game runs a **READY · 三 · 二 · 一** countdown and a **FIGHT!** cue, and ends with a
**WINNER!** or **DRAW!** callout. The HUD always shows the set score, the current
set / location / difficulty, and the in-set game tally.

## Controls

The six playable buttons are **▲ ▼ ◀ ▶ A B** (START is the console's pause/quit and isn't used in
play). On the console, each player simply uses their own controller — player 1 is controller 1,
player 2 is controller 2.

For browser testing on a single keyboard:

|                | ▲ | ▼ | ◀ | ▶ | A | B |
|----------------|---|---|---|---|---|---|
| **Player 1**   | ↑ | ↓ | ← | → | Space | Backspace |
| **Player 2**   | W | S | A | D | F | G |

Player 1's keyboard is provided by the Mebobox SDK. The SDK gives player 2 no keyboard, so
`src/input.js` adds the W/A/S/D/F/G half purely for testing.

## Running it

ES modules must be served over HTTP (not `file://`), and the SDK is loaded from Mebobox:

```sh
cd RendaFury
python3 -m http.server 8000
# then open http://localhost:8000  (needs internet for the SDK)
```

On the console it runs like any Mebobox game: the agent serves it and rewrites the SDK
`<script src>` to a local copy.

**Offline browser testing:** download `mebobox.min.js` next to `index.html` and point the
`<script src>` at it.

## Project layout

Flow is a small async state machine in `src/main.js`:
`title()` → `playMatch()` → `results()`, looping forever. Each screen/game is an `async` function
that renders into `#app` and resolves with its outcome.

| File | Role |
|------|------|
| `index.html`      | Shell: `#stage` (location bg), `#hud`, `#app` (active screen), `#banner` (overlays). |
| `style.css`       | The whole theme (deep red/black/gold, P1 red / P2 blue), sized in `vw/vh`. |
| `src/main.js`     | Entry point + top-level flow loop. |
| `src/config.js`   | Tunables: difficulties, best-of options, usable buttons, timeouts, keyboard map. |
| `src/input.js`    | Per-player input: SDK `player(1)`/`player(2)` + the P2 keyboard fallback. |
| `src/audio.js`    | Synth cues (dong/blip), voice callouts, and per-location music. |
| `src/locations.js`| The 10 locations + random distinct picks per match. |
| `src/ui.js`       | HUD, banners, countdowns, stage/app helpers. |
| `src/title.js`    | Title screen: choose difficulty + best-of. |
| `src/simon.js`    | The memory duel → winner `1\|2\|0`. |
| `src/bash.js`     | The button-bash tiebreak → winner `1\|2`. |
| `src/match.js`    | Orchestrates sets / games / locations + scoring + HUD. |
| `src/results.js`  | End-of-match screen. |

Result codes throughout: **1** = Player 1, **2** = Player 2, **0** = draw / undecided.

## Locations

Ten Japanese settings, one picked at random per set: Tokyo neon district, Kyoto temple at sunset,
Mount Fuji lakeside, Nara Park, Okinawa beach sunset, Osaka Dōtonbori, a moonlit samurai castle,
Shirakawa-gō village, a snowy mountain village, and a Tanabata festival. Each has its own
background and music under `assets/locations/<slug>/`.

## License

Proprietary — Mebobox Commercial Licence v0.1 (see `LICENSE`). Copyright © 2026 Stephen Hardisty.
