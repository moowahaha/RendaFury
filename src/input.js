// input.js — per-player input for a strictly 2-player game.
//
// Sources, merged:
//   • Player 1: Mebobox.player(1)  — a controller AND the keyboard (arrows / Space=A / Backspace=B),
//                because the SDK gives the keyboard to player 1.
//   • Player 2: Mebobox.player(2)  — the second controller …plus a keyboard fallback (W A S D / F /
//                G) handled here, so two players can be tested on ONE keyboard in a browser.
//
// API:
//   Input.init()
//   Input.onPress(player, cb)   -> cb(button); returns an unsubscribe fn
//   Input.onAnyPress(cb)        -> cb(player, button) for either player; returns unsubscribe
//   Input.isDown(player, button)
//   Input.players()             -> connected controller count (from the SDK)
import { KEYBOARD, USABLE } from './config.js';

const listeners = { 1: new Set(), 2: new Set() };
const anyListeners = new Set();
const kbDown = { 1: {}, 2: {} };         // keyboard-held state (edge detection for the P2 fallback)
let started = false;

function emit(player, button) {
  for (const cb of listeners[player]) { try { cb(button); } catch (e) {} }
  for (const cb of anyListeners) { try { cb(player, button); } catch (e) {} }
}

// Build a reverse lookup (KeyCode -> button) for a player's keyboard half.
function keyMap(player) {
  const m = {};
  const def = KEYBOARD[player] || {};
  for (const btn of Object.keys(def)) m[def[btn]] = btn;
  return m;
}

export const Input = {
  init() {
    if (started) return;
    started = true;
    const MB = window.Mebobox;

    // SDK per-player presses (controllers + P1 keyboard).
    if (MB && MB.player) {
      MB.player(1).onPress((btn) => emit(1, btn));
      MB.player(2).onPress((btn) => emit(2, btn));
    }

    // Keyboard fallback for Player 2 (the SDK doesn't give it a keyboard). Edge-detected so holding a
    // key doesn't auto-repeat as many presses. Only the mapped P2 keys are consumed.
    const p2map = keyMap(2);
    window.addEventListener('keydown', (e) => {
      const btn = p2map[e.code];
      if (!btn) return;
      e.preventDefault();
      if (kbDown[2][btn]) return;        // already held
      kbDown[2][btn] = true;
      emit(2, btn);
    });
    window.addEventListener('keyup', (e) => {
      const btn = p2map[e.code];
      if (btn) kbDown[2][btn] = false;
    });
  },

  onPress(player, cb) {
    listeners[player].add(cb);
    return () => listeners[player].delete(cb);
  },

  onAnyPress(cb) {
    anyListeners.add(cb);
    return () => anyListeners.delete(cb);
  },

  isDown(player, button) {
    const MB = window.Mebobox;
    if (MB && MB.player && MB.player(player).isDown(button)) return true;
    if (player === 2 && kbDown[2][button]) return true;
    return false;
  },

  players() {
    const MB = window.Mebobox;
    return MB && MB.players ? MB.players() : 1;
  },
};

// Tiny helper: validate a button is one we use in play.
export const isPlayable = (btn) => USABLE.includes(btn);
