// results.js — end-of-match screen: who won, the set score, a little detail. Waits for a button to
// return to the title. Resolves when a player presses A / START.
import { Input } from './input.js';
import { Audio } from './audio.js';
import { setApp, el, HUD, clearBanner } from './ui.js';
import { P1 } from './config.js';

export function results(r) {
  return new Promise((resolve) => {
    HUD.hide();
    clearBanner();
    const wcls = r.winner === P1 ? 'p1' : 'p2';
    const screen = el('div', 'screen');
    screen.innerHTML = `
      <div class="logo"><div class="kanji">勝者</div></div>
      <div class="result-winner ${wcls}">PLAYER ${r.winner} WINS!</div>
      <div class="result-score">${r.p1Sets} &mdash; ${r.p2Sets}</div>
      <div class="result-meta">${r.difficulty.label} &middot; best of ${r.totalSets} &middot; ${r.setsPlayed} set${r.setsPlayed === 1 ? '' : 's'} played</div>
      <div class="hint">Ⓐ / START for the title screen</div>`;
    setApp(screen);
    Audio.voice('winner');

    const off = Input.onAnyPress((player, btn) => {
      if (btn === 'a' || btn === 'start') { Audio.dong(260); off(); resolve(); }
    });
  });
}
