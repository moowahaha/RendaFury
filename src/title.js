// title.js — the title screen: pick difficulty + best-of length, then start. Either player can drive
// it. Resolves with { difficulty, totalSets }.
import { Input } from './input.js';
import { Audio } from './audio.js';
import { setApp, el, HUD, setStage } from './ui.js';
import { DIFFICULTIES, DIFFICULTY_ORDER, SET_OPTIONS, MENU_BG, MENU_MUSIC } from './config.js';

export function title() {
  return new Promise((resolve) => {
    HUD.hide();
    setStage(MENU_BG);                 // title/menu backdrop
    Audio.music(MENU_MUSIC);           // looping menu theme
    let row = 0;            // 0 = difficulty, 1 = best-of
    let diff = 0;          // index into DIFFICULTY_ORDER
    let sets = 0;          // index into SET_OPTIONS

    const screen = el('div', 'screen');
    screen.innerHTML = `
      <div class="logo"><div class="kanji">連打</div><div class="latin"><span class="word renda">Renda</span><span class="word fury">FURY!</span></div></div>
      <div class="menu">
        <div class="menu-row" data-row="0"><div class="label">DIFFICULTY</div><div class="opts" id="opt-diff"></div></div>
        <div class="menu-row" data-row="1"><div class="label">BEST OF</div><div class="opts" id="opt-sets"></div></div>
      </div>
      <div class="player-only">2 PLAYER ONLY!</div>`;
    setApp(screen);

    // Explosion stingers as each half of the logo lands. They fire once, with the on-load slide-in —
    // but ONLY if audio is already live (console, or a return visit to the title). On a browser's very
    // first load audio is still locked, so we deliberately schedule nothing: queuing a buffer on a
    // suspended context makes it play late (and doubled) the moment the user's first press resumes it.
    const renda = screen.querySelector('.renda');
    const fury = screen.querySelector('.fury');
    renda.addEventListener('animationend', () => { if (Audio.ready()) Audio.explosion({ volume: 0.35, duration: 0.25, cutoff: 1000 }); });
    fury.addEventListener('animationend', () => { if (Audio.ready()) { Audio.explosion({ volume: 0.6, duration: 0.5, cutoff: 1700 }); Audio.voice('intro'); } });

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

    // The first press wakes browser audio (a gesture is needed to start the AudioContext) — but does
    // NOT replay the logo reveal; that plays once on load and shouldn't re-trigger. The same press
    // still navigates, so no input is dropped.
    let woken = false;
    const off = Input.onAnyPress((player, btn) => {
      if (!woken) { woken = true; Audio.unlock(); }
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
