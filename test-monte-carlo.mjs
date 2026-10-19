import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const home = fs.readFileSync('index.html', 'utf8');
const funcs = names => names.map(name => home.split('\n').find(line => line.startsWith(`function ${name}(`))).join('\n');

const ctx = vm.createContext({
  URLSearchParams,
  console,
  crypto: globalThis.crypto,
  performance: { now: () => Date.now() }
});

// Setup environment and load game functions
vm.runInContext(`
let width = 9, height = 9, mineCount = 10, cells = [], noGuessMode = false, randomState = 0;
${funcs(['neighbors', 'seedRandom', 'random', 'plant', 'isSolvable'])}

// Standard 3BV Calculation Function
function compute3BV(w, h, mineCells) {
  const isMine = new Set(mineCells);
  const getNeighbors = (i) => {
    const x = i % w, y = Math.floor(i / w), out = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) out.push(ny * w + nx);
      }
    }
    return out;
  };

  const counts = Array.from({ length: w * h }, (_, i) => 
    isMine.has(i) ? -1 : getNeighbors(i).filter(n => isMine.has(n)).length
  );

  const coveredByOpening = new Set();
  let openings = 0;

  // Flood-fill openings (clue 0)
  const visited0 = new Set();
  for (let i = 0; i < w * h; i++) {
    if (isMine.has(i) || counts[i] !== 0 || visited0.has(i)) continue;
    openings++;
    const q = [i];
    visited0.add(i);
    while (q.length) {
      const cur = q.shift();
      coveredByOpening.add(cur);
      for (const n of getNeighbors(cur)) {
        coveredByOpening.add(n);
        if (counts[n] === 0 && !visited0.has(n)) {
          visited0.add(n);
          q.push(n);
        }
      }
    }
  }

  // Count isolated numbers
  let isolated = 0;
  for (let i = 0; i < w * h; i++) {
    if (!isMine.has(i) && !coveredByOpening.has(i)) {
      isolated++;
    }
  }

  return { bbbv: openings + isolated, openings, isolated };
}
`, ctx);

console.log('--- Starting Pro-Tier Monte Carlo Audit (10,000 Boards) ---');

const configurations = [
  { name: 'Mini (5x5/3)', w: 5, h: 5, m: 3, rounds: 2000, testNoGuess: true },
  { name: 'Easy (7x7/6)', w: 7, h: 7, m: 6, rounds: 2500, testNoGuess: true },
  { name: 'Beginner (9x9/10)', w: 9, h: 9, m: 10, rounds: 3000, testNoGuess: true },
  { name: 'Intermediate (16x16/40)', w: 16, h: 16, m: 40, rounds: 1500, testNoGuess: false },
  { name: 'Expert (30x16/99)', w: 30, h: 16, m: 99, rounds: 1000, testNoGuess: false }
];

let totalTested = 0;
let total3BV = 0;

for (const cfg of configurations) {
  const startTime = Date.now();
  let firstClickOpenings = 0;
  let min3BV = Infinity;
  let max3BV = 0;
  let noGuessSuccesses = 0;

  for (let r = 0; r < cfg.rounds; r++) {
    totalTested++;
    const first = Math.floor(Math.random() * (cfg.w * cfg.h));
    
    // Test standard board generation
    vm.runInContext(`
      width = ${cfg.w}; height = ${cfg.h}; mineCount = ${cfg.m};
      cells = Array.from({ length: width * height }, () => ({ mine: false, count: 0 }));
      noGuessMode = false;
      seedRandom('mc-${cfg.name}-${r}-${Date.now()}');
      plant(${first});
    `, ctx);

    const check = vm.runInContext(`
      ({
        firstMine: cells[${first}].mine,
        firstCount: cells[${first}].count,
        mineTotal: cells.filter(c => c.mine).length,
        bbbvData: compute3BV(width, height, cells.map((c, i) => c.mine ? i : null).filter(i => i !== null))
      })
    `, ctx);

    // Assert first click is strictly Opening (0 mines around, not a mine)
    assert.equal(check.firstMine, false, `First click hit a mine in ${cfg.name}`);
    assert.equal(check.firstCount, 0, `First click was not an opening (0) in ${cfg.name}`);
    assert.equal(check.mineTotal, cfg.m, `Incorrect mine count in ${cfg.name}`);
    firstClickOpenings++;

    const bbbv = check.bbbvData.bbbv;
    if (bbbv < min3BV) min3BV = bbbv;
    if (bbbv > max3BV) max3BV = bbbv;
    total3BV += bbbv;

    // Test No-Guess board verification on supported sizes
    if (cfg.testNoGuess && r < 500) {
      const ngCheck = vm.runInContext(`
        (() => {
          noGuessMode = true;
          cells = Array.from({ length: width * height }, () => ({ mine: false, count: 0 }));
          seedRandom('ng-${cfg.name}-${r}');
          const success = plant(${first});
          const solved = success ? isSolvable(${first}, new Set(cells.map((c, i) => c.mine ? i : null).filter(i => i !== null))) : false;
          return { success, solved };
        })()
      `, ctx);

      if (ngCheck.success) {
        assert.equal(ngCheck.solved, true, `False positive in isSolvable for ${cfg.name}`);
        noGuessSuccesses++;
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✓ [${cfg.name}] ${cfg.rounds} boards verified in ${elapsed}s:`);
  console.log(`   - 100% First-click opening rate (${firstClickOpenings}/${cfg.rounds})`);
  console.log(`   - 3BV range: ${min3BV} to ${max3BV}`);
  if (cfg.testNoGuess) {
    console.log(`   - No-Guess verified generation: ${noGuessSuccesses}/500 attempts passed`);
  }
}

console.log(`\n======================================================`);
console.log(`🎉 10,000-Board Pro-Tier Audit Passed with 0 Failures!`);
console.log(`======================================================\n`);
