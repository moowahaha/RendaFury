// audio.js — voice callouts, the countdown "dong", and per-location background music.
//
// VOICE: real recorded clips in assets/voice, played via Wonderbox.sound (which handles the console's
//   audio sandbox + autoplay). A cached <audio> fallback covers plain-browser testing without the SDK.
// DONG: synthesized with the Web Audio API (no asset needed), like the Wonderbox boot screen.
// MUSIC: per-location track via Wonderbox.music (set in src/match.js when a set starts).

const VOICE_PATH = {
  ready:   'assets/voice/ready.mp3',     // before each game's countdown
  go:      'assets/voice/go.mp3',        // when play begins (FIGHT!)
  tie:     'assets/voice/tie.mp3',       // a memory game drawn
  player1: 'assets/voice/player1.mp3',   // player 1 wins a game
  player2: 'assets/voice/player2.mp3',   // player 2 wins a game
  winner:  'assets/voice/winner.mp3',    // end of the match
  intro:   'assets/voice/intro.mp3',     // title screen, as "FURY!" slides in
};
const voiceEls = {};                       // cached <audio> elements for the browser fallback

let actx = null;
let currentMusic;                          // URL of the track currently set (undefined = none yet)
function ctx() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
  if (actx && actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }
  return actx;
}

export const Audio = {
  // Has audio been unlocked (a user gesture happened, so sound can actually play)? Browsers start the
  // AudioContext suspended until then; on the console there's no such restriction.
  ready() { return !!(actx && actx.state === 'running'); },

  // Unlock/resume audio after a user gesture, and (re)start any music that autoplay had blocked.
  unlock() {
    const c = ctx();                       // creates + resumes the context
    const m = window.Wonderbox && window.Wonderbox.music;
    if (m && currentMusic) { try { m.set(currentMusic, { volume: 0.5, loop: true, autoplay: true }); } catch (e) {} }
    return !!c;
  },

  // A deep gong/"dong" for each countdown beat. freq lower = heavier.
  dong(freq = 180) {
    const c = ctx(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 1.0);
  },

  // A short high "tick" (used for lighting each step of a memory sequence).
  blip(freq = 440) {
    const c = ctx(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.2);
  },

  // A synthesized explosion: a filtered noise burst plus a low "boom" thump, both fast-decaying.
  // opts: { volume, duration, cutoff } — bigger/louder for a heavier blast.
  explosion({ volume = 0.5, duration = 0.35, cutoff = 1300 } = {}) {
    const c = ctx(); if (!c) return;
    const t = c.currentTime;

    // Noise burst (the "crack"), low-passed and swept down so it darkens as it decays.
    const frames = Math.max(1, Math.floor(c.sampleRate * duration));
    const buf = c.createBuffer(1, frames, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource(); noise.buffer = buf;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(cutoff, t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(80, cutoff * 0.12), t + duration);
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(volume, t + 0.008);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    noise.connect(lp).connect(ng).connect(c.destination);
    noise.start(t); noise.stop(t + duration);

    // Low sine "boom" (the body), pitched down for weight.
    const o = c.createOscillator(); const og = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(42, t + duration);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(volume * 0.9, t + 0.02);
    og.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(og).connect(c.destination);
    o.start(t); o.stop(t + duration + 0.05);
  },

  // Voice callout by key: 'ready' | 'go' | 'tie' | 'player1' | 'player2' | 'winner' | 'intro'.
  voice(line) {
    const url = VOICE_PATH[line]; if (!url) return;
    const s = window.Wonderbox && window.Wonderbox.sound;
    if (s && s.play) { try { s.play(url, { volume: 1 }); return; } catch (e) {} }
    // Browser fallback (no SDK sound API): play via a cached <audio> element.
    try {
      let el = voiceEls[line];
      if (!el) { el = voiceEls[line] = new Audio(url); }
      el.currentTime = 0; el.volume = 1; el.play().catch(() => {});
    } catch (e) {}
  },

  // Background music (looping). Pass a URL, or null to stop. Calling with the track that's already
  // playing is a no-op, so menu music flows seamlessly across screens without re-triggering.
  music(url) {
    const m = window.Wonderbox && window.Wonderbox.music; if (!m) return;
    if (url === currentMusic) return;
    currentMusic = url;
    try {
      if (!url) { m.stop(); return; }
      m.set(url, { volume: 0.5, loop: true, autoplay: true });
    } catch (e) {}
  },
};
