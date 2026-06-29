# Renda Fury

A **strictly 2-player** Japanese / Street-Fighter-flavoured button-fighting game for the **Mebobox**
console (by Mebobox), built on the **Mebobox SDK**. Two players duel across a best-of-N series of
sets; each set mixes **memory duels** with a **button-bash** decider. Pure static HTML/CSS/JS (ES
modules) — no build step, no framework. **Testable in a browser.**

**License**: proprietary — Mebobox Commercial Licence v0.1 (see `LICENSE`, copied from
`../MeboboxSite/legal`). Copyright © 2026 Stephen Hardisty.

> This file is the orientation for continued development. The current state is a **working scaffold**:
> the full game flow plays end-to-end (browser-testable), with placeholder audio/art and first-pass
> balancing. The "Next steps" list at the bottom is where to go.

## How to run / test (browser)

ES modules must be served over HTTP (not `file://`), and the SDK is loaded from Mebobox:

```
cd RendaFury
python3 -m http.server 8000
# open http://localhost:8000  (needs internet for the SDK; see "Offline" below)
```

On the **console** it runs like any Mebobox game: the agent serves it and rewrites the SDK
`<script src>` to a local copy; player 1 = controller 1 (or the keyboard), player 2 = controller 2.

### Controls (2 players)
The 6 playable buttons are **▲ ▼ ◀ ▶ A B** (no START/SELECT in play — START is the console's
pause/quit). For browser testing on one keyboard:

| | ▲ | ▼ | ◀ | ▶ | A | B |
|---|---|---|---|---|---|---|
| **Player 1** (SDK keyboard + pad 1) | ↑ | ↓ | ← | → | Space | Backspace |
| **Player 2** (fallback in `input.js` + pad 2) | W | S | A | D | F | G |

Player 1's keyboard comes from the SDK (it maps the keyboard to player 1). The SDK gives player 2 **no**
keyboard, so `src/input.js` adds the W/A/S/D/F/G half purely for testing. On the console each player
just uses their own controller.

## Game rules (as implemented)

- **Match** = best of `totalSets` (3, 5 or 7); first to `ceil(totalSets/2)` **sets** wins.
- **Set** = up to 3 games at one **location** (random per set):
  - **Game 1 & 2 — Memory** (`simon.js`): the computer shows a random button sequence on both pads,
    then hides it; both players race to reproduce it. First to complete it correctly wins the game; a
    wrong press resets that player's progress. No clean run within **5 s** → **DRAW**.
  - If the two memory games are **level** (1–1, or 0–0 from two draws) → **Game 3 — Button Bash**
    (`bash.js`): the game picks 2 buttons; each player must press them **alternately** (▲, B, ▲, B, …)
    as fast as they can for **5 s** — most correct alternating presses wins (pressing the same button
    twice doesn't score). The timed round only ends on the clock; a dead heat goes to **sudden death**
    (next correct alternation wins), so it's always decisive.
  - Otherwise the set goes to whoever won more of the two memory games.
- **Difficulty** (`config.js → DIFFICULTIES`) sets the memory sequence **length** and **speed**:
  - **White Belt** — 3 buttons, slow. **Black Belt** — 5, medium. **Furious** — 6, fast.
- **Every game** runs a **READY · 3 · 2 · 1** countdown (each beat a synth "dong") then **FIGHT!**,
  and ends with a **WINNER!** or **DRAW!** callout. (Memory shows its sequence between the count and
  FIGHT; bash goes straight to FIGHT.)
- The **HUD** (top bar) always shows the set score (pips per player), the current set/location/
  difficulty, and the in-set game tally. The **results** screen shows the match winner + score.

## Architecture (file by file)

Flow is a simple async state machine in `src/main.js`:
`title()` → `playMatch()` → `results()` → back to title, forever. Each screen/game is an `async`
function that renders into `#app` and resolves with its outcome.

| File | Role |
|------|------|
| `index.html` | Shell: `#stage` (location bg), `#hud`, `#app` (active screen), `#banner` (overlays). Loads the SDK + `src/main.js`. |
| `style.css` | The whole theme (deep red/black/gold, P1 red / P2 blue). Everything in `vw/vh` for any TV. |
| `src/main.js` | Entry point + top-level flow loop. |
| `src/config.js` | **Tunables**: difficulties, best-of options, usable buttons, timeout, bash target, keyboard map. |
| `src/input.js` | `Input`: per-player presses, merging SDK `player(1)/player(2)` + the P2 keyboard fallback. |
| `src/audio.js` | `Audio`: synth **dong/blip** (Web Audio), **voice** callouts (speech-synth placeholder), per-location **music** (via `Mebobox.music`). |
| `src/locations.js` | The 10 locations + `pickLocations(n)` (random, distinct per match). |
| `src/ui.js` | `HUD`, `banner()`, `ready321()` / `fight()` / `countdown()`, `setStage()`, `setApp()`, `el()`, `wait()`. |
| `src/title.js` | Title screen: choose difficulty + best-of. |
| `src/simon.js` | The memory game → winner `1\|2\|0`. |
| `src/bash.js` | The button-bash tiebreak → winner `1\|2`. |
| `src/match.js` | Orchestrates sets/games/locations + scoring + HUD. |
| `src/results.js` | End-of-match screen. |

Result codes everywhere: **1** = Player 1, **2** = Player 2, **0** = draw / undecided (`P1/P2/DRAW` in `config.js`).

## Mebobox SDK usage

- **Input**: `Mebobox.player(n).onPress/onRelease/isDown` (1-based), `Mebobox.players()`,
  `Mebobox.onPlayers(fn)`. `Mebobox.BUTTONS` = `up,down,left,right,a,b,start,select`. See `input.js`.
- **Audio**: `Mebobox.music.set(url,{volume,loop,autoplay})` and `Mebobox.sound.play(url)`. See `audio.js`.
- The SDK is `0.4.0` (multiplayer). It runs standalone in a browser (reads keyboard + gamepads).

## Placeholders to replace (art + audio)

- **Voice** (`audio.js`): real recorded clips in `assets/voice/` — `ready` (each countdown), `go`
  (FIGHT!), `tie` (memory draw), `player1`/`player2` (a player wins a game), `winner` (match end),
  `intro` (title, as "FURY!" slides in). Played via `Mebobox.sound` (with an `<audio>` fallback for
  plain-browser testing). Triggered from `ui.js`, `simon.js`, `bash.js`, `results.js`, `title.js`.
- **Locations** (`assets/locations/<slug>/`, e.g. `tokyo-neon-district-night/`): each has a
  `background.jpg` + `music.mp3` (wired via `locations.js` → `setStage`/`Audio.music` in `match.js`).
- **Title / menu** (`config.js → MENU_BG`, `MENU_MUSIC`): `assets/background.jpg` backdrop +
  `assets/bgm.mp3` looping theme, shown on the title + results screens.
- **Cover**: `assets/cover.png` (square) for the CHOOSE GAME grid.
- **Fonts** (`assets/fonts/`, declared in `style.css`): **Jersey 15** is the global font; **Honk** is
  the game-name display font for the title logo (its two words slide in from opposite sides). Both are
  bundled locally so the game stays offline-capable. The kanji keep a system Japanese fallback.
- **Offline SDK**: for offline browser testing, download `mebobox.min.js` next to `index.html` and
  point the `<script src>` at it. (On the console the agent provides it automatically.)

## Next steps / ideas

- **Polish the feel**: hit-spark FX, screen shake on a win, brush-stroke transitions, per-player colour
  flourishes, a proper title attract loop.
- **Join/ready gate**: a "Player 2 press A to join" step before a match (and graceful handling if only
  one controller is connected on the console — `Input.players()`).
- **START handling**: the SDK owns START (pause / hold-3s → main menu) during play; decide how pause
  should interact with a live game/countdown.
- **Balancing**: tune `DIFFICULTIES`, the 5 s memory timeout, and the 5 s bash timebox (`BASH_SECONDS`); consider
  growing sequence length across the two memory games.
- **More memory variety**: show-faster-each-round, partial-credit, or per-player different sequences.
- **Accessibility**: colour-blind-safe P1/P2 cues beyond red/blue.
- **Real assets**: backgrounds, music, voice, cover, font (see above).

## Conventions

- Plain ES modules, no build step. Keep it static (served by the agent / any static server).
- Match the existing module style (small, single-purpose, `async` screens resolving outcomes).
- 16:9, scale with `vw/vh`. Keep text TV-readable (large).
- Built on the Mebobox SDK only — no other runtime deps.
