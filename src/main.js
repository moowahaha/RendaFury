// main.js — Renda Fury entry point. Wires input and runs the top-level flow:
//   title (pick difficulty + best-of) → match (sets/games) → results → back to title, forever.
//
// Built on the Mebobox SDK (window.Mebobox), which is loaded by index.html and also runs
// standalone in a plain browser, so this is testable in a browser (see CLAUDE.md for the controls).
import { Input } from './input.js';
import { title } from './title.js';
import { playMatch } from './match.js';
import { results } from './results.js';

async function boot() {
  Input.init();
  // A first user gesture unlocks audio in browsers; the SDK also resumes audio on first input.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const opts = await title();        // { difficulty, totalSets }
    const result = await playMatch(opts);
    await results(result);
  }
}

// The SDK script is loaded synchronously in <head>, so window.Mebobox is ready; start on DOM ready.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
