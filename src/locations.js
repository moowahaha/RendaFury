// locations.js — the 10 stage locations. Each set of a match is played at a different, randomly
// chosen location. Backgrounds + music are added later by dropping files into
// assets/locations/location-NN/ (see each folder's README.txt). Names are placeholders — rename to
// match the art you supply.
const NAMES = [
  'Dojo', 'Bamboo Forest', 'Mount Fuji', 'Temple Steps', 'Neon Alley',
  'Cherry Garden', 'Harbour at Dusk', 'Castle Keep', 'Hot Spring', 'Festival Arena',
];

const BG_FILE = 'background.jpg';     // also try .png at runtime
const MUSIC_FILE = 'music.mp3';

export const LOCATIONS = NAMES.map((name, i) => {
  const id = 'location-' + String(i + 1).padStart(2, '0');
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
