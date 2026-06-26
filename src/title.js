// title.js — the title screen: pick difficulty + best-of length, then start. Either player can drive
// it. Resolves with { difficulty, totalSets }.
import { Input } from './input.js';
import { Audio } from './audio.js';
import { setApp, el, HUD } from './ui.js';
import { DIFFICULTIES, DIFFICULTY_ORDER, SET_OPTIONS } from './config.js';

export function title() {
  return new Promise((resolve) => {
    HUD.hide();
    let row = 0;            // 0 = difficulty, 1 = best-of
    let diff = 0;          // index into DIFFICULTY_ORDER
    let sets = 0;          // index into SET_OPTIONS

    const screen = el('div', 'screen');
    screen.innerHTML = `
      <div class="logo"><div class="kanji">連打</div><div class="latin">RENDA&nbsp;FURY</div></div>
      <div class="menu">
        <div class="menu-row" data-row="0"><div class="label">DIFFICULTY</div><div class="opts" id="opt-diff"></div></div>
        <div class="menu-row" data-row="1"><div class="label">BEST OF</div><div class="opts" id="opt-sets"></div></div>
      </div>
      <div class="hint">▲▼ choose &middot; ◀▶ change &middot; Ⓐ / START to begin</div>
      <div class="controls-note">Strictly 2 players. &nbsp; P1: arrows + Space/Backspace (or pad 1). &nbsp; P2: W&nbsp;A&nbsp;S&nbsp;D + F/G (or pad 2).</div>`;
    setApp(screen);

    const optDiff = screen.querySelector('#opt-diff');
    const optSets = screen.querySelector('#opt-sets');
    DIFFICULTY_ORDER.forEach((k) => optDiff.appendChild(el('div', 'opt', DIFFICULTIES[k].label)));
    SET_OPTIONS.forEach((n) => optSets.appendChild(el('div', 'opt', String(n))));

    function paint() {
      screen.querySelectorAll('.menu-row').forEach((r, i) => r.classList.toggle('active', i === row));
      [...optDiff.children].forEach((c, i) => c.classList.toggle('sel', i === diff));
      [...optSets.children].forEach((c, i) => c.classList.toggle('sel', i === sets));
    }
    paint();

    const off = Input.onAnyPress((player, btn) => {
      if (btn === 'up' || btn === 'down') { row = row ? 0 : 1; Audio.blip(520); paint(); }
      else if (btn === 'left' || btn === 'right') {
        const d = btn === 'left' ? -1 : 1;
        if (row === 0) diff = (diff + d + DIFFICULTY_ORDER.length) % DIFFICULTY_ORDER.length;
        else sets = (sets + d + SET_OPTIONS.length) % SET_OPTIONS.length;
        Audio.blip(660); paint();
      } else if (btn === 'a' || btn === 'start') {
        Audio.dong(260); off();
        resolve({ difficulty: DIFFICULTIES[DIFFICULTY_ORDER[diff]], totalSets: SET_OPTIONS[sets] });
      }
    });
  });
}
