// audio.js — voice callouts, the countdown "dong", and per-location background music.
//
// VOICE: scaffolded with the browser's speech synthesis (deep + slow for a dramatic, arcade feel).
//   TODO: replace with real "Street Fighter"-style recorded voice clips. Drop e.g.
//   assets/voice/ready.mp3, fight.mp3, winner.mp3, draw.mp3 and switch VOICE_FILES on — they'll play
//   via Wonderbox.sound (which handles the console's audio sandbox + autoplay for you).
//
// DONG: synthesized with the Web Audio API (no asset needed), like the Wonderbox boot screen.
// MUSIC: per-location track via Wonderbox.music (set in src/match.js when a set starts).

const VOICE_FILES = false;                 // flip to true once assets/voice/*.mp3 exist
const VOICE_PATH = { ready: 'assets/voice/ready.mp3', fight: 'assets/voice/fight.mp3', winner: 'assets/voice/winner.mp3', draw: 'assets/voice/draw.mp3' };
const VOICE_TEXT = { ready: 'Ready', fight: 'Fight!', winner: 'Winner!', draw: 'Draw!' };

let actx = null;
function ctx() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
  if (actx && actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }
  return actx;
}

export const Audio = {
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

  // Voice callout: 'ready' | 'fight' | 'winner' | 'draw'.
  voice(line) {
    if (VOICE_FILES && window.Wonderbox && window.Wonderbox.sound && VOICE_PATH[line]) {
      try { window.Wonderbox.sound.play(VOICE_PATH[line], { volume: 1 }); return; } catch (e) {}
    }
    // Placeholder: speech synthesis, pitched down for drama.
    try {
      const synth = window.speechSynthesis; if (!synth) return;
      const u = new SpeechSynthesisUtterance(VOICE_TEXT[line] || line);
      u.rate = 0.85; u.pitch = 0.3; u.volume = 1;
      synth.cancel(); synth.speak(u);
    } catch (e) {}
  },

  // Per-location background music (looping). Pass a URL, or null to stop.
  music(url) {
    const m = window.Wonderbox && window.Wonderbox.music; if (!m) return;
    try {
      if (!url) { m.stop(); return; }
      m.set(url, { volume: 0.5, loop: true, autoplay: true });
    } catch (e) {}
  },
};
