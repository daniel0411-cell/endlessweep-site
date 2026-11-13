import assert from 'node:assert/strict';
import {page} from './test-helpers.mjs';

const g=page(),{run,el}=g;
// Reproduce the real boundary failure, then exercise all four edges and corners.
for(const [col,row] of [[14,6],[0,6],[7,0],[7,11],[0,0],[14,0],[0,11],[14,11]]){
  run("endlessGame('natural-7');playerReveal(82)");
  run(`{
    const x=endlessViewX+${col},y=endlessViewY+${row};
    const clue=getEndlessCell(x,y);clue.mine=false;clue.open=true;
    const around=getEndlessNeighbors(x,y);around.forEach(c=>{if(c.mine)c.flag=true});
    syncEndlessCells();chord(${row}*width+${col});
    if(ended)throw new Error('Correct flags caused a boundary death');
    if(around.some(c=>!c.mine&&!c.open))throw new Error('Boundary target was skipped');
    if([...endlessGrid.values()].some(c=>c.mine&&c.open))throw new Error('Unrelated mine opened');
  }`);
}
run("endlessGame('natural-7');playerReveal(82)");
const field=run('JSON.stringify(Array.from({length:441},(_,i)=>{const c=getEndlessCell(i%21-10,Math.floor(i/21)-10);return [c.x,c.y,c.mine,c.open]}))');
const challenge=run('challengeUrl()');assert(new URL(challenge).searchParams.has('seed'));
g.ctx.location.pathname='/endless-minesweeper/';g.ctx.location.search=new URL(challenge).search;
run('loadShared()');assert.equal(run('JSON.stringify(Array.from({length:441},(_,i)=>{const c=getEndlessCell(i%21-10,Math.floor(i/21)-10);return [c.x,c.y,c.mine,c.open]}))'),field);
const oldView=run('endlessViewX'),cleared=run('endlessCleared');
el('#pan-controls').fire('click',{target:{dataset:{pan:'3,0'}}});assert.equal(run('endlessViewX'),oldView+3);assert.equal(run('endlessCleared'),cleared);
el('#pan').fire('click');el('#board').fire('pointerdown',{button:0,pointerId:1,clientX:100,clientY:100});el('#board').fire('pointermove',{pointerId:1,clientX:30,clientY:100});
assert.equal(run('endlessViewX'),oldView+5);el('#board').fire('pointerup');assert.equal(run('endlessCleared'),cleared);
el('#difficulty').value='beginner';el('#difficulty').fire('change');assert.equal(run('endlessMode'),false);assert.equal(run('cells.length'),81);assert.equal(el('#endless-progress').hidden,true);

// Three genuinely completed Time Attack boards must all contain ten mines.
run("timeAttackGame();gameSeed='regression-ta-0';playerReveal(40);seconds=12");
const timer=run('timer');
for(let n=0;n<3;n++){
  assert.equal(run('cells.filter(c=>c.mine).length'),10);
  let moves=0;
  while(run('timeBoards')===n){
    assert(++moves<=81,'Board did not finish');
    const target=run('cells.findIndex(c=>!c.mine&&!c.open)');assert(target>=0);
    run(`playerReveal(${target})`);
  }
  assert.equal(run('timeBoards'),n+1);assert.equal(run('timeScore'),(n+1)*96);assert.equal(run('seconds'),12);assert.equal(run('timer'),timer);
  if(n<2)run(`gameSeed='regression-ta-${n+1}';playerReveal(40)`);
}
// Chords use the same score and mistake paths as individual reveals.
for(const mode of ['timeAttackGame','zenGame']){
  run(`${mode}();playerReveal(40);cells.forEach(c=>{c.open=false;c.flag=false});cells[40].open=true;cells[40].count=1;neighbors(40).forEach(n=>{cells[n].mine=false;cells[n].count=1});cells[30].mine=true;cells[31].flag=true;timeScore=20;chord(40)`);
  assert.equal(run(mode==='timeAttackGame'?'timeMistakes':'zenMistakes'),1);assert.equal(run('ended'),false);
  if(mode==='timeAttackGame')assert.equal(run('timeScore'),21); // -5 + six safe neighbors
}
run("difficulty.value='expert';newGame('expert','audit-rate');playerReveal(40);seconds=1;playerReveal(cells.findIndex(c=>c.mine))");
assert(!el('#analysis-efficiency').textContent.includes('/s'));assert.equal(run('actions.at(-1).progress'),false);
run("zenGame('beginner','zen-shared');playerReveal(40)");const zenLayout=run('cells.map(c=>c.mine).join()');
g.ctx.location.pathname='/';g.ctx.location.search=new URL(run('challengeUrl()')).search;run('loadShared();playerReveal(40)');assert.equal(run('cells.map(c=>c.mine).join()'),zenLayout);

// Milestones and best records survive a reload, but do not change the minefield.
g.beacons.length=0;
run("endlessGame('milestones');playerReveal(82)");const mines=run('JSON.stringify([...endlessGrid.values()].map(c=>[c.x,c.y,c.mine]))');
for(const n of [49,50,100,250]){run(`endlessCleared=${n};updateEndlessProgress();updateEndlessProgress()`);assert.equal(el('#endless-meter').value,n)}
assert.equal(run('JSON.stringify([...endlessGrid.values()].map(c=>[c.x,c.y,c.mine]))'),mines);
assert.match(el('#endless-goal').textContent,/500/);assert.match(el('#endless-achievement').textContent,/250/);
const milestoneEvents=(await Promise.all(g.beacons.map(b=>b.text()))).map(JSON.parse).filter(e=>e.event==='endless_milestone');
assert.deepEqual(milestoneEvents.map(e=>e.cleared),[50,100,250]);
run('finishEndless();finishEndless()');const completions=(await Promise.all(g.beacons.map(b=>b.text()))).map(JSON.parse).filter(e=>e.event==='game_completed'&&e.mode==='endless');assert.equal(completions.length,1);
const stats=JSON.parse(g.saved.get('endlessweep-stats'));assert.equal(stats.endless.best,250);
const reload=page('index.html',{'endlessweep-stats':JSON.stringify(stats)});reload.run("endlessGame('new');endlessCleared=251;updateEndlessProgress()");assert.match(reload.el('#endless-achievement').textContent,/New personal best/);
const statsPage=page('minesweeper-statistics/index.html',{'endlessweep-stats':JSON.stringify(stats)});
assert.match(statsPage.el('#stats').innerHTML,/250 cleared/);assert.match(statsPage.el('#history').innerHTML,/250 cleared/);assert.match(statsPage.el('#history').innerHTML,/Infinite minefield/);

// Independent enumeration validates every displayed two-row puzzle and answer.
const practice=page('minesweeper-practice/index.html');
const puzzles=practice.run('puzzles');assert.equal(puzzles.length,30);
for(const [id,p] of puzzles.entries()){
  const layouts=Array.from({length:2**p.clues.length},(_,mask)=>Array.from({length:p.clues.length},(_,i)=>(mask>>i)&1)).filter(bits=>p.clues.every((n,i)=>bits.slice(Math.max(0,i-1),i+2).reduce((a,b)=>a+b,0)===+n));
  assert(layouts.length>0,p.title);
  const answers=p.clues.map((_,i)=>i).filter(i=>layouts.every(bits=>bits[i]===(p.action==='flag'?1:0)));
  assert(answers.includes(p.answer),p.title);
  for(const answer of answers){practice.run(`answered=false;mode='${p.action}';choose(${answer},document.createElement('button'),${id})`);assert.match(practice.el('#feedback').innerHTML,/Correct\./)}
}

// Image recognition must preserve a 9x9 grid and wait for explicit review.
const solver=page('minesweeper-solver/index.html');
function syntheticGrid(cols,rows,pitch=32){const w=cols*pitch,h=rows*pitch,data=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=(x%pitch<2||y%pitch<2)?40:200;const i=(y*w+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255}return {width:w,height:h,data}}
let image=syntheticGrid(9,9);const create=solver.document.createElement;solver.document.createElement=tag=>tag==='canvas'?{getContext:()=>({drawImage(){},getImageData:()=>({data:image.data})})}:create();
solver.ctx.image=image;solver.run('parseImage(image)');assert.equal(solver.run('curGrid.length'),9);assert.equal(solver.run('curGrid[0].length'),9);solver.run('calculate()');assert.match(solver.el('#summary-text').textContent,/confirm/);
solver.run('curGrid=[[null,null,null],[1,2,1]]');solver.el('#confirm-image').checked=true;solver.run('calculate()');assert.match(solver.el('#summary-text').textContent,/valid configuration/);
solver.run('cycleCell(0,0)');assert.equal(solver.el('#confirm-image').checked,false);
image={...syntheticGrid(41,2,16)};solver.ctx.image=image;solver.run('parseImage(image)');assert.match(solver.el('#scan-status').textContent,/No image cells were imported/);
console.log('Regression checks passed: boundaries, pan, mode switching, 3-board scoring, chords, sharing, milestones, statistics, 30 puzzles, image review');
