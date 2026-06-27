// simon.js — the memory game (like the kids' game "Simon" / "Bop It" recall). The computer shows a
// random sequence of buttons; both players then race to reproduce it. First to complete it correctly
// wins; a wrong press resets that player's progress. No one finishes within the timeout → DRAW.
//
// playSimon(difficulty) -> Promise<1 | 2 | 0>   (winner, or 0 for a draw)
import { Input } from './input.js';
import { Audio } from './audio.js';
import { setApp, el, banner, ready, count321, fight, wait, padHtml } from './ui.js';
import { USABLE, SIMON_TIMEOUT_MS, P1, P2, DRAW } from './config.js';

function randomSeq(len) {
  const s = [];
  for (let i = 0; i < len; i++) s.push(USABLE[Math.floor(Math.random() * USABLE.length)]);
  return s;
}

function buildArena() {
  const arena = el('div', 'arena');
  arena.innerHTML = `
    <div class="player-col p1">
      <div class="ptag">PLAYER 1</div>${padHtml()}
      <div class="progress" id="prog1"></div>
    </div>
    <div class="player-col p2">
      <div class="ptag">PLAYER 2</div>${padHtml()}
      <div class="progress" id="prog2"></div>
    </div>`;
  setApp(arena);
  return arena;
}

const dots = (done, total) => '●'.repeat(done) + '○'.repeat(Math.max(0, total - done));

export async function playSimon(difficulty) {
  const arena = buildArena();
  const padKey = (player, k) => arena.querySelector(`.player-col.p${player} .key[data-k="${k}"]`);
  const prog = { 1: arena.querySelector('#prog1'), 2: arena.querySelector('#prog2') };

  await ready();
  await wait(500);                 // a beat after the level/READY settles, before the pattern flashes

  // --- show the sequence on BOTH pads (memorise) ---
  const seq = randomSeq(difficulty.seqLen);
  prog[1].textContent = prog[2].textContent = dots(0, seq.length);
  for (const k of seq) {
    Audio.blip(380 + USABLE.indexOf(k) * 70);
    padKey(1, k).classList.add('lit'); padKey(2, k).classList.add('lit');
    await wait(difficulty.showMs);
    padKey(1, k).classList.remove('lit'); padKey(2, k).classList.remove('lit');
    await wait(difficulty.gapMs);
  }

  await wait(250);                 // a beat between the pattern ending and the 三 二 一 countdown

  // --- count the players in, then race. Input opens a hair (~30ms) before GO! so a press landing
  //     right on GO still counts, without being lenient ---
  await count321();

  const winner = await new Promise((resolve) => {
    const progress = { 1: 0, 2: 0 };
    let done = false;
    const offs = [];
    const finish = (w) => { if (done) return; done = true; offs.forEach((o) => o()); clearTimeout(timer); resolve(w); };

    function handle(player, btn) {
      if (done || !USABLE.includes(btn)) return;
      if (btn === seq[progress[player]]) {
        progress[player]++;
        const k = padKey(player, btn); k.classList.add('lit'); setTimeout(() => k.classList.remove('lit'), 120);
        Audio.blip(520);
        prog[player].textContent = dots(progress[player], seq.length);
        if (progress[player] >= seq.length) finish(player);
      } else {
        progress[player] = 0;                       // wrong → start over
        const k = padKey(player, btn); k.classList.add('miss'); setTimeout(() => k.classList.remove('miss'), 200);
        Audio.blip(120);
        prog[player].textContent = dots(0, seq.length);
      }
    }
    offs.push(Input.onPress(P1, (b) => handle(P1, b)));
    offs.push(Input.onPress(P2, (b) => handle(P2, b)));
    const timer = setTimeout(() => finish(DRAW), SIMON_TIMEOUT_MS);
    setTimeout(fight, 30);                            // input is already live; GO! lands a hair later
  });

  await showResult(winner);
  return winner;
}

async function showResult(winner) {
  if (winner === DRAW) { Audio.voice('tie'); await banner('TIE!', { cls: 'gold', sub: 'no clean run', ms: 1600 }); }
  else { Audio.voice('player' + winner); await banner('WINNER!', { cls: winner === P1 ? 'p1' : 'p2', sub: 'PLAYER ' + winner, ms: 1600 }); }
}
