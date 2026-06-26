// ui.js — shared DOM helpers: the HUD (top score bar), the big banner overlay (READY / FIGHT! /
// WINNER! …), the countdown, and the per-set stage background.
import { Audio } from './audio.js';

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

export function setApp(node) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  if (node) app.appendChild(node);
  return app;
}

// Set the stage background to a location image (falls back to the CSS default if it fails to load).
export function setStage(location) {
  const stage = document.getElementById('stage');
  if (!location) { stage.style.backgroundImage = ''; return; }
  const img = new Image();
  img.onload = () => { stage.style.backgroundImage = `url("${location.bg}")`; };
  img.onerror = () => {                       // try .png, else keep the default rays
    const png = location.bg.replace(/\.jpg$/, '.png');
    const img2 = new Image();
    img2.onload = () => { stage.style.backgroundImage = `url("${png}")`; };
    img2.src = png;
  };
  img.src = location.bg;
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

// ---- countdown pieces: READY · 3 · 2 · 1 (each a dong) … then FIGHT! -----
// Split so the memory game can slot its "watch the sequence" phase between the count and FIGHT.
export async function ready321() {
  Audio.voice('ready');
  await banner('READY', { cls: 'gold', ms: 650 });
  for (const n of [3, 2, 1]) {
    Audio.dong();
    await banner(String(n), { ms: 650 });
  }
}
export async function fight() {
  Audio.voice('fight');
  await banner('FIGHT!', { cls: 'red', ms: 600 });
}
// Full countdown (READY · 3 · 2 · 1 · FIGHT!) — used by the bash tiebreak.
export async function countdown() { await ready321(); await fight(); }
