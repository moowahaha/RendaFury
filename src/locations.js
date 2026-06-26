// locations.js — the 10 stage locations. Each set of a match is played at a different, randomly
// chosen location. Backgrounds + music are added later by dropping files into the matching
// assets/locations/<id>/ folder (see each folder's README.txt). The `id` is the web-friendly
// folder slug; `name` is the display name shown in the HUD.
const NAMES = [
  ['tokyo-neon-district-night', 'Tokyo Neon District (Night)'],
  ['kyoto-temple-sunset',       'Kyoto Temple at Sunset'],
  ['mount-fuji-lakeside',       'Mount Fuji Lakeside'],
  ['osaka-dotonbori',           'Osaka Dotonbori'],
  ['snowy-mountain-village',    'Snowy Mountain Village'],
  ['okinawa-beach-sunset',      'Okinawa Beach Sunset'],
  ['nara-park',                 'Nara Park'],
  ['shirakawa-go-village',      'Shirakawa-go Village'],
  ['tanabata-festival',         'Tanabata Festival'],
  ['samurai-castle-moonlit',    'Samurai Castle (Moonlit)'],
];

const BG_FILE = 'background.jpg';     // also try .png at runtime
const MUSIC_FILE = 'music.mp3';

export const LOCATIONS = NAMES.map(([id, name]) => {
  const dir = 'assets/locations/' + id;
  return { id, name, dir, bg: dir + '/' + BG_FILE, music: dir + '/' + MUSIC_FILE };
});

// Pick `n` distinct locations at random (for the sets of one match). If n exceeds the pool, it wraps.
export function pickLocations(n) {
  const pool = LOCATIONS.slice();
  for (let i = pool.length - 1; i > 0; i--) {        // Fisher–Yates shuffle
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const out = [];
  for (let i = 0; i < n; i++) out.push(pool[i % pool.length]);
  return out;
}
