// bash.js — the alternating-button tiebreak (3rd game of a set, only if the two memory games were
// level). The game picks two buttons; each player must press them ALTERNATELY — e.g. ▲, B, ▲, B, … —
// as fast as they can for BASH_SECONDS. Each correct alternating press scores; pressing the same
// button twice in a row (or the wrong one) doesn't. Most presses when the clock runs out wins. The
// round only ever ends on the clock — and if the two players are level (including nobody pressing
// anything), the tiebreak is a DRAW and the whole set is tied.
//
// playBash() -> Promise<1 | 2 | 0>   (winner, or 0 for a tie)
import { Input } from './input.js';
import { Audio } from './audio.js';
import { setApp, el, banner, countdown, padHtml } from './ui.js';
import { USABLE, SYMBOL, BASH_SECONDS, P1, P2, DRAW } from './config.js';

function pickTwoButtons() {
  const pool = USABLE.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return [pool[0], pool[1]];
}

export async function playBash() {
  const keys = pickTwoButtons();
  const other = (k) => (k === keys[0] ? keys[1] : keys[0]);
  const label = `${SYMBOL[keys[0]]}  ⇄  ${SYMBOL[keys[1]]}`;

  const arena = el('div', 'arena');
  arena.innerHTML = `
    <div class="player-col p1">
      <div class="ptag">PLAYER 1</div>
      ${padHtml()}
      <div class="meter"><i id="bar1"></i></div>
      <div class="count" id="cnt1">0</div>
    </div>
    <div class="player-col" style="flex:0 0 auto; text-align:center">
      <div class="ptag" style="color:var(--gold)">TIEBREAK!</div>
      <div style="font-size:7vh; font-weight:900; letter-spacing:.1em">${label}</div>
      <div class="bash-clock" id="clock" style="font-size:9vh; font-weight:900; color:var(--gold); line-height:1">${BASH_SECONDS}</div>
      <div class="bash-tip">PRESS THE TWO BUTTONS AS FAST AS POSSIBLE TO WIN</div>
    </div>
    <div class="player-col p2">
      <div class="ptag">PLAYER 2</div>
      ${padHtml()}
      <div class="meter"><i id="bar2"></i></div>
      <div class="count" id="cnt2">0</div>
    </div>`;
  setApp(arena);

  const padKey = (player, k) => arena.querySelector(`.player-col.p${player} .key[data-k="${k}"]`);

  await countdown();   // READY · 3 · 2 · 1 · GO!

  const winner = await new Promise((resolve) => {
    const count = { 1: 0, 2: 0 };
    const next = { 1: keys[0], 2: keys[0] };   // the button each player must press next
    let done = false;
    const offs = [];
    const bar = { 1: arena.querySelector('#bar1'), 2: arena.querySelector('#bar2') };
    const cnt = { 1: arena.querySelector('#cnt1'), 2: arena.querySelector('#cnt2') };
    const clock = arena.querySelector('#clock');
    const finish = (w) => { if (done) return; done = true; offs.forEach((o) => o()); clearInterval(tick); resolve(w); };

    // Light the two playable buttons on both pads; highlight the one each player must press next.
    [P1, P2].forEach((p) => keys.forEach((k) => padKey(p, k).classList.add('active')));
    function showNext(player) {
      keys.forEach((k) => padKey(player, k).classList.toggle('next', k === next[player]));
    }
    showNext(P1); showNext(P2);

    // Bars are relative to the current leader, so whoever's ahead is full and the gap shows.
    function render() {
      const max = Math.max(count[1], count[2], 1);
      bar[1].style.width = (100 * count[1] / max) + '%';
      bar[2].style.width = (100 * count[2] / max) + '%';
      cnt[1].textContent = count[1];
      cnt[2].textContent = count[2];
    }

    function handle(player, btn) {
      if (done || !keys.includes(btn)) return;
      if (btn !== next[player]) {                  // wrong half of the pair — broke the alternation
        const k = padKey(player, btn); k.classList.add('miss'); setTimeout(() => k.classList.remove('miss'), 150);
        Audio.blip(120);
        return;
      }
      const k = padKey(player, btn); k.classList.add('lit'); setTimeout(() => k.classList.remove('lit'), 100);
      count[player]++;                             // correct alternating press
      next[player] = other(btn);
      showNext(player);
      render();
      if (count[player] % 10 === 0) Audio.blip(300 + count[player]);
    }
    offs.push(Input.onPress(P1, (b) => handle(P1, b)));
    offs.push(Input.onPress(P2, (b) => handle(P2, b)));

    // Only the clock ends it. Level (including nobody pressing) → DRAW, so the set is simply tied.
    const start = performance.now();
    const tick = setInterval(() => {
      const left = BASH_SECONDS - (performance.now() - start) / 1000;
      if (left <= 0) { clearInterval(tick); clock.textContent = '0'; finish(count[1] === count[2] ? DRAW : (count[1] > count[2] ? P1 : P2)); }
      else clock.textContent = Math.ceil(left);
    }, 100);
  });

  if (winner === DRAW) { Audio.voice('tie'); await banner('TIE!', { cls: 'gold', sub: 'no winner', ms: 1600 }); }
  else { Audio.voice('player' + winner); await banner('WINNER!', { cls: winner === P1 ? 'p1' : 'p2', sub: 'PLAYER ' + winner, ms: 1600 }); }
  return winner;
}
