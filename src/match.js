// match.js — orchestrates a whole match: best-of-N sets, each at a random location, each set = 2
// memory games + (only if level) a bash tiebreak. Keeps the HUD score updated throughout.
//
// playMatch({ difficulty, totalSets }) -> Promise<result>
//   result = { winner, p1Sets, p2Sets, setsPlayed, difficulty, totalSets }
import { playSimon } from './simon.js';
import { playBash } from './bash.js';
import { pickLocations } from './locations.js';
import { Audio } from './audio.js';
import { HUD, banner, setStage, wait, instruction } from './ui.js';
import { GAMES_PER_SET, P1, P2, DRAW } from './config.js';

export async function playMatch({ difficulty, totalSets }) {
  const setsToWin = Math.ceil(totalSets / 2);
  const locations = pickLocations(totalSets);
  const score = { 1: 0, 2: 0 };
  let setIndex = 0;
  let firstMemoryIntro = true, firstBashIntro = true;   // show each how-to-play hint once per match

  const hud = (loc, gamesLine) => HUD.render({
    setsToWin, p1Sets: score[1], p2Sets: score[2],
    sub: `${difficulty.label} · SET ${setIndex + 1}/${totalSets} · ${loc.name.toUpperCase()}`,
    games: gamesLine,
  });

  while (score[1] < setsToWin && score[2] < setsToWin && setIndex < totalSets) {
    const loc = locations[setIndex];
    setStage(loc);
    Audio.music(loc.music);

    hud(loc, '');
    await banner('SET ' + (setIndex + 1), { cls: 'gold', sub: loc.name, ms: 1500 });

    // --- the set: two memory games, then a tiebreak if level ---
    const gw = { 1: 0, 2: 0 };
    const tally = () => `THIS SET — P1 ${gw[1]} : ${gw[2]} P2`;

    for (let g = 1; g <= 2; g++) {
      hud(loc, `GAME ${g}/${GAMES_PER_SET} · MEMORY     ${tally()}`);
      if (firstMemoryIntro) { firstMemoryIntro = false; instruction('FIRST TO MATCH THE PATTERN WINS!', '記憶'); }
      const w = await playSimon(difficulty);
      if (w !== DRAW) gw[w]++;
      await wait(600);
    }

    let setWinner;
    if (gw[1] !== gw[2]) {
      setWinner = gw[1] > gw[2] ? P1 : P2;
    } else {
      hud(loc, `GAME ${GAMES_PER_SET}/${GAMES_PER_SET} · BUTTON BASH     ${tally()}`);
      await banner('TIEBREAK', { cls: 'red', sub: 'button bash', ms: 1400 });
      if (firstBashIntro) { firstBashIntro = false; instruction('MOST BUTTON PRESSES WINS!', '連打'); }
      setWinner = await playBash();
    }

    setIndex++;
    if (setWinner === DRAW) {                     // tied tiebreak → nobody scores, on to the next set
      hud(loc, 'SET DRAWN');
      await banner('SET DRAWN', { cls: 'gold', sub: 'no points', ms: 1800 });
    } else {
      score[setWinner]++;
      hud(loc, `SET TO PLAYER ${setWinner}`);
      await banner('PLAYER ' + setWinner, { cls: setWinner === P1 ? 'p1' : 'p2', sub: 'takes the set', ms: 1800 });
    }
  }

  Audio.music(null);
  const winner = score[1] > score[2] ? P1 : P2;
  return { winner, p1Sets: score[1], p2Sets: score[2], setsPlayed: setIndex, difficulty, totalSets };
}
