// bash.js — the button-bash tiebreak (3rd game of a set, only if the two memory games were level).
// The game picks two buttons; both players hammer them as fast as they can. First to BASH_TARGET
// presses wins. There's always a winner (it's a decider).
//
// playBash() -> Promise<1 | 2>
import { Input } from './input.js';
import { Audio } from './audio.js';
import { setApp, el, banner, countdown, wait } from './ui.js';
import { USABLE, SYMBOL, BASH_TARGET, P1, P2 } from './config.js';

function pickTwoButtons() {
  const pool = USABLE.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return [pool[0], pool[1]];
}

export async function playBash() {
  const keys = pickTwoButtons();
  const label = keys.map((k) => SYMBOL[k]).join('  +  ');

  const arena = el('div', 'arena');
  arena.innerHTML = `
    <div class="player-col p1">
      <div class="ptag">PLAYER 1</div>
      <div class="meter"><i id="bar1"></i></div>
      <div class="count" id="cnt1">0</div>
    </div>
    <div class="player-col" style="flex:0 0 auto; text-align:center">
      <div class="ptag" style="color:var(--gold)">TIEBREAK!</div>
      <div style="font-size:7vh; font-weight:900; letter-spacing:.1em">${label}</div>
      <div style="opacity:.75; font-size:2.2vh">first to ${BASH_TARGET}</div>
    </div>
    <div class="player-col p2">
      <div class="ptag">PLAYER 2</div>
      <div class="meter"><i id="bar2"></i></div>
      <div class="count" id="cnt2">0</div>
    </div>`;
  setApp(arena);

  await countdown();   // READY · 3 · 2 · 1 · FIGHT!

  const winner = await new Promise((resolve) => {
    const count = { 1: 0, 2: 0 };
    let done = false;
    const offs = [];
    const bar = { 1: arena.querySelector('#bar1'), 2: arena.querySelector('#bar2') };
    const cnt = { 1: arena.querySelector('#cnt1'), 2: arena.querySelector('#cnt2') };
    const finish = (w) => { if (done) return; done = true; offs.forEach((o) => o()); resolve(w); };

    function handle(player, btn) {
      if (done || !keys.includes(btn)) return;
      count[player] = Math.min(BASH_TARGET, count[player] + 1);
      bar[player].style.width = (100 * count[player] / BASH_TARGET) + '%';
      cnt[player].textContent = count[player];
      if (count[player] % 10 === 0) Audio.blip(300 + count[player]);
      if (count[player] >= BASH_TARGET) finish(player);
    }
    offs.push(Input.onPress(P1, (b) => handle(P1, b)));
    offs.push(Input.onPress(P2, (b) => handle(P2, b)));
  });

  Audio.voice('winner');
  await banner('WINNER!', { cls: winner === P1 ? 'p1' : 'p2', sub: 'PLAYER ' + winner, ms: 1600 });
  return winner;
}
