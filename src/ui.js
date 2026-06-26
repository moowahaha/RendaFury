// ui.js — shared DOM helpers: the HUD (top score bar), the big banner overlay (READY / GO! /
// WINNER! …), the countdown, and the per-set stage background.
import { Audio } from './audio.js';
import { USABLE, SYMBOL } from './config.js';

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

// The illustrative button pad (d-pad cross on the left, A above B on the right). Shared by the memory
// game and the tiebreak so both show the same controller layout.
export function padHtml() {
  return `<div class="pad">${USABLE.map((k) => `<div class="key" data-k="${k}">${SYMBOL[k]}</div>`).join('')}</div>`;
}

export function setApp(node) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  if (node) app.appendChild(node);
  return app;
}

// Set the stage background to an image (falls back to the CSS default if it fails to load). Accepts a
// location object ({ bg }) or a plain URL string; null clears it back to the default rays.
export function setStage(location) {
  const stage = document.getElementById('stage');
  if (!location) { stage.style.backgroundImage = ''; return; }
  const bg = typeof location === 'string' ? location : location.bg;
  const img = new Image();
  img.onload = () => { stage.style.backgroundImage = `url("${bg}")`; };
  img.onerror = () => {                       // try .png, else keep the default rays
    const png = bg.replace(/\.jpg$/, '.png');
    const img2 = new Image();
    img2.onload = () => { stage.style.backgroundImage = `url("${png}")`; };
    img2.src = png;
  };
  img.src = bg;
}

// ---- HUD ----------------------------------------------------------------
export const HUD = {
  hide() { document.getElementById('hud').classList.add('hidden'); },

  // info = { setsToWin, p1Sets, p2Sets, title, sub, games }
  render(info) {
    const hud = document.getElementById('hud');
    hud.classList.remove('hidden');
    const pips = (won, total) => Array.from({ length: total },
      (_, i) => `<div class="pip ${i < won ? 'win' : ''}"></div>`).join('');
    hud.innerHTML = `
      <div class="hud-side p1">
        <div class="hud-name">PLAYER 1</div>
        <div class="hud-sets">${pips(info.p1Sets, info.setsToWin)}</div>
      </div>
      <div class="hud-center">
        <div class="hud-title">${info.title || 'RENDA FURY'}</div>
        <div class="hud-sub">${info.sub || ''}</div>
        <div class="hud-games">${info.games || ''}</div>
      </div>
      <div class="hud-side p2">
        <div class="hud-name">PLAYER 2</div>
        <div class="hud-sets">${pips(info.p2Sets, info.setsToWin)}</div>
      </div>`;
  },
};

// ---- banner -------------------------------------------------------------
// Show a big centered word. ms=0 leaves it up until clearBanner() (used for WINNER!). Returns a promise.
export function banner(text, opts = {}) {
  const b = document.getElementById('banner');
  const cls = opts.cls ? ' ' + opts.cls : '';
  const sub = opts.sub ? `<span class="banner-sub">${opts.sub}</span>` : '';
  b.innerHTML = `<div class="txt${cls}">${text}${sub}</div>`;
  b.classList.remove('hidden');
  // retrigger the slam animation
  const txt = b.querySelector('.txt');
  void txt.offsetWidth;
  const ms = opts.ms == null ? 900 : opts.ms;
  if (ms === 0) return Promise.resolve();
  return wait(ms).then(() => { b.classList.add('hidden'); });
}
export function clearBanner() { document.getElementById('banner').classList.add('hidden'); }

// ---- countdown pieces: READY · 三 二 一 (each a dong) … then GO! -----
// Split into parts so the memory game can show its sequence mid-countdown:
//   READY → watch the sequence → 三 二 一 → GO!   (the bash uses the whole thing back-to-back).
export async function ready() {
  Audio.voice('ready');
  await banner('READY', { cls: 'gold', ms: 650 });
}
export async function count321() {
  for (const k of ['三', '二', '一']) {        // 3 · 2 · 1 in kanji, for flavour
    Audio.dong();
    await banner(k, { ms: 650 });
  }
}
export async function ready321() { await ready(); await count321(); }
export async function fight() {
  Audio.voice('go');
  await banner('GO!', { cls: 'red', ms: 600 });
}
// Full countdown (READY · 三 二 一 · GO!) — used by the bash tiebreak.
export async function countdown() { await ready321(); await fight(); }

// ---- instruction strip ----------------------------------------------------
// An OTT, kanji-flanked one-liner that pops in at the top, holds, then fades. Fire-and-forget; used
// for first-time hints during a match (e.g. "FIRST TO MATCH THE PATTERN!"). `kanji` flanks both sides.
export function instruction(text, kanji, ms = 4200) {
  const bar = document.getElementById('instruction');
  if (!bar) return;
  bar.innerHTML = `<div class="instr-inner"><span class="instr-k">${kanji}</span><span class="instr-t">${text}</span><span class="instr-k">${kanji}</span></div>`;
  bar.classList.remove('hidden', 'out');
  void bar.offsetWidth;                     // restart the pop-in animation
  bar.classList.add('show');
  clearTimeout(bar._hide); clearTimeout(bar._gone);
  bar._hide = setTimeout(() => bar.classList.add('out'), ms);
  bar._gone = setTimeout(() => { bar.classList.remove('show'); bar.classList.add('hidden'); }, ms + 450);
}
