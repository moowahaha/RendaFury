// config.js — tunable game constants. The numbers here are the scaffold's first guess; balance later.

// The buttons that can appear in a memory sequence or a button-bash. We deliberately use the 6
// "playable" buttons (no START/SELECT — START is the console's pause/quit). They map cleanly to a
// d-pad + two face buttons on a controller, and to the keyboard halves below for browser testing.
export const USABLE = ['up', 'down', 'left', 'right', 'a', 'b'];

// Pretty symbols for showing a button on screen.
export const SYMBOL = { up: '▲', down: '▼', left: '◀', right: '▶', a: 'A', b: 'B', start: 'S', select: 'E' };

// Difficulty affects the memory game: how long the sequence is and how fast it's shown.
// showMs = how long each button stays lit; gapMs = dark gap between buttons. Faster = harder.
export const DIFFICULTIES = {
  white:   { key: 'white',   label: 'WHITE BELT', seqLen: 3, showMs: 850, gapMs: 260 },
  black:   { key: 'black',   label: 'BLACK BELT', seqLen: 5, showMs: 560, gapMs: 180 },
  furious: { key: 'furious', label: 'FURIOUS',    seqLen: 6, showMs: 340, gapMs: 120 },
};
export const DIFFICULTY_ORDER = ['white', 'black', 'furious'];

// Best-of options: a match is N sets, first to win ceil(N/2).
export const SET_OPTIONS = [3, 5, 7];

export const GAMES_PER_SET = 3;          // 2 memory games, then a bash tiebreak if still level
export const SIMON_TIMEOUT_MS = 5000;    // no completed sequence within this → DRAW
export const BASH_SECONDS = 5;           // timeboxed tiebreak: most alternating presses in this window wins

// Title / menu screen assets (the non-gameplay screens). Per-location assets live in locations.js.
export const MENU_BG = 'assets/background.jpg';   // backdrop for the title + results screens
export const MENU_MUSIC = 'assets/bgm.mp3';       // looping music for the title + results screens

// Result codes used throughout: a game/set winner is 1, 2, or 0 (draw / not decided).
export const P1 = 1, P2 = 2, DRAW = 0;

// Keyboard fallback so the game is fully testable in a browser on ONE keyboard.
// Player 1 is ALSO handled by the SDK (arrows / Space=A / Backspace=B). Player 2 has no SDK keyboard
// (the SDK gives the keyboard to player 1 only), so we map a second half here.
export const KEYBOARD = {
  // Player 1 reference (handled by the Wonderbox SDK; listed for the on-screen controls hint).
  1: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', a: 'Space', b: 'Backspace' },
  // Player 2 fallback (handled by src/input.js directly).
  2: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', a: 'KeyF', b: 'KeyG' },
};
