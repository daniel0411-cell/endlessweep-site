import assert from 'node:assert/strict';
import {page} from './test-helpers.mjs';

const g=page(),{run,el}=g;
const analyze=(view,w,h,budget)=>run(`analyzeVisibleBoard(${JSON.stringify(view)},${w},${h}${budget===undefined?'':','+budget})`);
const around=(i,w,h)=>{const out=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(y*w+x!==i&&Math.abs(x-i%w)<=1&&Math.abs(y-Math.floor(i/w))<=1)out.push(y*w+x);return out};

// Independently enumerate every compatible hidden layout for each visible view.
// Assert each reported fact holds in ALL solutions, not just the planted board.
let checked=0;
for(let mask=0;mask<512;mask++) {
  const mine=i=>!!(mask&(1<<i)),clues=Array.from({length:9},(_,i)=>around(i,3,3).filter(mine).length);
  for(const revealMask of [1,7,56,73,170,341,511]) {
    const view=clues.map((n,i)=>!mine(i)&&(revealMask&(1<<i))?n:null),hidden=view.map((n,i)=>n===null?i:-1).filter(i=>i>=0);
    const result=analyze(view,3,3);assert(result.consistent);
    const compatible=[];
    for(let bits=0;bits<2**hidden.length;bits++) {
      const mines=new Set(hidden.filter((_,n)=>bits&(1<<n)));
      if(view.every((n,i)=>n===null||around(i,3,3).filter(j=>mines.has(j)).length===n))compatible.push(mines);
    }
    assert(compatible.length);
    for(const [i,fact] of result.known){assert(view[i]===null);assert(compatible.every(mines=>mines.has(i)===fact.mine),`Unsound deduction: ${JSON.stringify(view)}, cell ${i}`);checked++}
  }
}
assert(checked>1000);
const pattern=analyze([null,null,null,1,2,1],3,2);
assert.equal(pattern.known.get(0).mine,true);assert.equal(pattern.known.get(1).mine,false);assert.equal(pattern.known.get(2).mine,true);
assert.equal(analyze([1,null,null,null],2,2).known.size,0);
assert.equal(analyze([8,null,null,null],2,2).consistent,false);
assert.equal(analyze([9],1,1).consistent,false);
const capped=analyze([null,null,null,1,2,1],3,2,0);assert(capped.limited);assert.equal(capped.known.size,0);

// A real failed seeded game restores precisely the state BEFORE the fatal move.
run("newGame('beginner','review-regression');playerReveal(40)");
const before=run('JSON.stringify(cells.map(c=>({open:c.open,flag:c.flag})))'),beforeStats=g.saved.get('endlessweep-stats');
run('playerReveal(cells.findIndex(c=>c.mine));reviewMistake()');
assert.equal(run('JSON.stringify(cells.map(c=>({open:c.open,flag:c.flag})))'),before);
assert.equal(run('ended'),false);assert.equal(run('replayMode'),true);
assert.equal(el('#mistake-details').hidden,false);
assert(el('#board').children.every(b=>!b.className.split(' ').includes('mine')),'Replay leaked mine styling');
const saved=g.saved.get('endlessweep-stats');assert(saved!==beforeStats);
run('reviewMistake()');assert.equal(g.saved.get('endlessweep-stats'),saved,'Review changed statistics');
run('seekReplay(lastReplay.actions.length)');assert.equal(el('#mistake-details').hidden,true);
assert(el('#board').children.some(b=>b.className.split(' ').includes('mine')),'Revealed replay mine lacks styling');
run('exitReplay()');assert.equal(run('replayMode'),false);assert.equal(el('#mistake-details').hidden,true);
assert.equal(g.saved.get('endlessweep-stats'),saved,'Exiting a replay recorded a spurious abandoned game');

// Use a valid 1-2-1 state to inspect proof/highlight behavior and chord mistakes.
run(`width=3;height=2;mineCount=2;cells=Array.from({length:6},(_,i)=>({mine:[0,2].includes(i),open:i>=3,flag:false,count:0}));cells.forEach((c,i)=>c.count=neighbors(i).filter(j=>cells[j].mine).length);buildBoard();showMistakeReason({type:'reveal',i:0})`);
assert.match(el('#mistake-verdict').textContent,/was provable/);
assert(el('#mistake-proof').children.length>=3);
assert(el('#board').children[0].classList.contains('review'));
assert(el('#board').children.slice(3).some(b=>b.classList.contains('review-clue')));
const explanation=el('#mistake-proof').children.map(b=>b.textContent).join();
// Tamper with every hidden clue count and flags: proof of the same mine is identical.
run("cells.slice(0,3).forEach(c=>{c.count=8;c.flag=true});showMistakeReason({type:'reveal',i:0})");
assert.equal(el('#mistake-proof').children.map(b=>b.textContent).join(),explanation);
run("cells[0].flag=false;cells[2].flag=false;showMistakeReason({type:'chord',i:4})");
assert.match(el('#mistake-verdict').textContent,/flagged square was provably safe/);
assert(el('#board').children[1].classList.contains('review-safe'));
assert(!el('#board').children[4].classList.contains('review'),'Chord clue was labeled a mine');
assert(el('#board').children[0].classList.contains('review'));assert(el('#board').children[2].classList.contains('review'));
assert.match(el('#mistake-verdict').textContent,/flag positions must be correct/);

// Full recorded chord -> loss -> replay flow retains flags and explains the
// wrong flag, rather than claiming the clicked number was a mine.
run(`width=3;height=2;mineCount=2;cells=Array.from({length:6},(_,i)=>({mine:[0,2].includes(i),open:i>=3,flag:[0,1].includes(i),count:0}));cells.forEach((c,i)=>c.count=neighbors(i).filter(j=>cells[j].mine).length);started=true;ended=false;replayMode=false;actions=[{type:'reveal',i:3,t:0},{type:'reveal',i:4,t:1},{type:'reveal',i:5,t:2},{type:'flag',i:0,t:3},{type:'flag',i:1,t:4}];buildBoard();chord(4);reviewMistake()`);
assert.match(el('#mistake-verdict').textContent,/flagged square was provably safe/);
assert.equal(run('lastReplay.actions.at(-1).type'),'chord');assert.equal(run('cells[4].open'),true);assert.equal(run('cells[2].open'),false);assert.equal(run('cells[1].flag'),true);
assert(!el('#board').children[4].classList.contains('review'));

// An unresolved hit can coexist with a provable safe alternative elsewhere.
run(`width=3;height=3;cells=Array.from({length:9},(_,i)=>({mine:i===0,open:[3,5].includes(i),flag:false,count:0}));cells.forEach((c,i)=>c.count=neighbors(i).filter(j=>cells[j].mine).length);buildBoard();showMistakeReason({type:'reveal',i:0})`);
assert.match(el('#mistake-verdict').textContent,/safe move was available elsewhere/);
assert(el('#board').children.some(b=>b.classList.contains('review-safe')));

// Unresolved local clues never become a claimed forced guess or a 50-50 label.
run(`width=2;height=2;cells=[{open:true,count:1,mine:false},{open:false,count:0,mine:true},{open:false,count:0,mine:false},{open:false,count:0,mine:false}];buildBoard();showMistakeReason({type:'reveal',i:1})`);
assert.match(el('#mistake-verdict').textContent,/does not prove guessing was required/);
assert.equal(el('#mistake-proof').children.length,0);
assert(!/50.?50|Guess Required|unavoidable/i.test(el('#mistake-verdict').textContent));
console.log(`Mistake review passed: ${checked} independently proven facts, subset proofs, flags ignored, chord targets, replay isolation, bounded analysis and unresolved wording`);
