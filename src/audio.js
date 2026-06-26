// audio.js — all game audio through the Web Audio API.
//
// Why not Wonderbox.music / .sound (HTMLAudioElement)? On the console the game runs in a sandboxed
// iframe that only ever receives FORWARDED input (postMessage), never a real user gesture, and this
// Chromium build won't autoplay an <audio> element there — so file playback via HTMLAudio stays
// silent. The Web Audio context, by contrast, can be resumed and plays decoded buffers reliably
// (the synth dong/blip already prove this). So we fetch + decodeAudioData every clip and play it as
// an AudioBufferSourceNode. (The console's game-content CSP allows the game to fetch its OWN files.)

const VOICE_PATH = {
  ready:   'assets/voice/ready.mp3',     // before each game's countdown
  go:      'assets/voice/go.mp3',        // when play begins (FIGHT!)
  tie:     'assets/voice/tie.mp3',       // a memory game drawn
  player1: 'assets/voice/player1.mp3',   // player 1 wins a game
  player2: 'assets/voice/player2.mp3',   // player 2 wins a game
  winner:  'assets/voice/winner.mp3',    // end of the match
  intro:   'assets/voice/intro.mp3',     // title screen, as "FURY!" slides in
};

let actx = null;
const MUSIC_VOL = 0.5, SFX_VOL = 1;
const buffers = {};                        // url -> Promise<AudioBuffer> (decode cache)
let musicUrl = null;                       // desired track (null = none)
let musicSrc = null, musicGain = null;     // the live looping source
let musicPlayingUrl = null;                // what musicSrc is actually playing

function ctx() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
  if (actx && actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }
  return actx;
}

function loadBuffer(url) {
  if (buffers[url]) return buffers[url];
  const c = ctx(); if (!c) return Promise.reject(new Error('no audio'));
  buffers[url] = fetch(url)
    .then((r) => { if (!r.ok) throw new Error('fetch ' + r.status + ' ' + url); return r.arrayBuffer(); })
    .then((ab) => c.decodeAudioData(ab))
    .catch((e) => { delete buffers[url]; throw e; });   // drop on failure so a later call can retry
  return buffers[url];
}

function stopMusic() {
  if (musicSrc) { try { musicSrc.stop(); } catch (e) {} try { musicSrc.disconnect(); } catch (e) {} }
  musicSrc = null; musicPlayingUrl = null;
}

function startMusic() {
  const c = ctx(); if (!c || !musicUrl) return;
  if (musicSrc && musicPlayingUrl === musicUrl) return;            // already playing the right track
  loadBuffer(musicUrl).then((buf) => {
    if (musicUrl == null) return;                                   // stopped while loading
    if (musicSrc && musicPlayingUrl === musicUrl) return;           // won a race
    stopMusic();
    musicGain = c.createGain(); musicGain.gain.value = MUSIC_VOL;
    musicSrc = c.createBufferSource(); musicSrc.buffer = buf; musicSrc.loop = true;
    musicSrc.connect(musicGain).connect(c.destination);
    musicSrc.start();
    musicPlayingUrl = musicUrl;
  }).catch(() => {});
}

export const Audio = {
  // Is the context actually running (audio audible)? Suspended until a gesture in a plain browser;
  // on the console autoplay lets it run.
  ready() { return !!(actx && actx.state === 'running'); },

  // Resume after a user gesture and (re)start any music autoplay had deferred.
  unlock() { const c = ctx(); startMusic(); return !!c; },

  // Deep gong/"dong" for each countdown beat.
  dong(freq = 180) {
    const c = ctx(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 1.0);
  },

  // Short high "tick" (used for lighting each step of a memory sequence).
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

  // Synthesized explosion: a filtered noise burst plus a low "boom", both fast-decaying.
  explosion({ volume = 0.5, duration = 0.35, cutoff = 1300 } = {}) {
    const c = ctx(); if (!c) return;
    const t = c.currentTime;
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

  // Thunder: a sharp crack that darkens into a long low rumble (paired with the tiebreak lightning).
  thunder() {
    const c = ctx(); if (!c) return;
    const t = c.currentTime;
    const dur = 1.8;
    const frames = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, frames, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource(); noise.buffer = buf;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1100, t);                                   // bright crack…
    lp.frequency.exponentialRampToValueAtTime(110, t + dur);               // …darkening to a rumble
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.8, t + 0.03);                    // crack
    ng.gain.exponentialRampToValueAtTime(0.3, t + 0.3);                     // settle into rumble
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);                  // long tail
    noise.connect(lp).connect(ng).connect(c.destination);
    noise.start(t); noise.stop(t + dur);
    // sub-bass rumble under it
    const o = c.createOscillator(); const og = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(72, t);
    o.frequency.exponentialRampToValueAtTime(34, t + dur);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
    og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(og).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.1);
  },

  // Voice callout (recorded clip): 'ready' | 'go' | 'tie' | 'player1' | 'player2' | 'winner' | 'intro'.
  voice(line) {
    const url = VOICE_PATH[line]; if (!url) return;
    const c = ctx(); if (!c) return;
    loadBuffer(url).then((buf) => {
      const g = c.createGain(); g.gain.value = SFX_VOL;
      const s = c.createBufferSource(); s.buffer = buf;
      s.connect(g).connect(c.destination); s.start();
    }).catch(() => {});
  },

  // Looping background music. Pass a URL, or null to stop. Re-calling with the current track is a
  // no-op, so menu/location music flows seamlessly without re-triggering.
  music(url) {
    url = url || null;
    if (url === musicUrl) return;
    musicUrl = url;
    if (!url) { stopMusic(); return; }
    startMusic();
  },
};
