import assert from 'node:assert/strict';
import {page} from './test-helpers.mjs';

// Fresh page entry, not a preinitialized home game, including all generated modes.
for(const route of ['easy','daily','zen','custom','time-attack','no-guess','endless','unblocked']){
  const slug=route==='unblocked'?'minesweeper-unblocked':`${route}-minesweeper`;
  const p=page(`${slug}/index.html`,{}, {pathname:`/${slug}/`,search:''});
  assert(p.run('Number.isInteger(width)&&Number.isInteger(height)&&cells.length===width*height'),route);
  assert.equal(p.el('#board').children.length,p.run('width*height'),route);
}

const finite=[...['mini','easy','beginner','intermediate','expert'].map(level=>`difficulty.value='${level}';newGame('${level}','audit-${level}')`),
  "customGame('audit-custom',{width:13,height:11,mines:24})",
  ...['beginner','intermediate','expert'].flatMap(level=>[
    `zenGame('${level}','audit-zen')`, `noGuessGame('${level}','audit-no-guess')`, `dailyGame('${level}')`])];
for(const setup of finite){
  const p=page(),{run,el}=p;run(setup);
  run("currentLevel==='daily'?chord(firstClick):playerReveal(Math.floor(height/2)*width+Math.floor(width/2))");
  assert(run('started&&!ended'),setup);assert(!el('#message').textContent.includes('Click a square to start'),setup);
  assert(run('cells.filter(c=>c.mine).length===mineCount'),setup);
  assert(run('cells.every((c,i)=>c.mine||c.count===neighbors(i).filter(n=>cells[n].mine).length)'),setup);
  const tick=p.intervals.get(run('timer'));tick();assert.equal(run('seconds'),1);
  run('togglePause()');const snapshot=run('JSON.stringify(cells)');
  run('playerReveal(cells.findIndex(c=>!c.open));toggleFlag(cells.findIndex(c=>!c.open))');tick();
  assert.equal(run('seconds'),1);assert.equal(run('JSON.stringify(cells)'),snapshot);
  run('togglePause()');tick();assert.equal(run('seconds'),2);
  const flag=run('cells.findIndex(c=>!c.open)');run(`toggleFlag(${flag});toggleFlag(${flag})`);assert.equal(run('flags'),0);
  const challenge=new URL(run('challengeUrl()'));
  if(!run("currentLevel==='daily'")){
    const clone=page('index.html',{}, {pathname:challenge.pathname,search:challenge.search});
    assert.equal(clone.run('cells.map(c=>+c.mine).join()'),run('cells.map(c=>+c.mine).join()'),setup);
    assert.equal(clone.run('cells.map(c=>+c.open).join()'),run('cells.map(c=>+c.open).join()'),setup);
  }
  if(run('zenMode')){run('playerReveal(cells.findIndex(c=>c.mine))');assert.equal(run('zenMistakes'),1);assert(!run('ended'))}
  // Oracle chooses safe moves only to exercise real completion, never calls finish directly.
  run('while(!ended){const i=cells.findIndex(c=>!c.mine&&!c.open);if(i<0)throw Error("No legal completion");playerReveal(i)}');
  assert.equal(el('#mines').textContent,0,setup);
  assert(run('lastReplay.won'),setup);assert.equal(p.intervals.size,0);
  const stats=p.saved.get('endlessweep-stats');run('beginReplay();seekReplay(lastReplay.actions.length)');
  assert(run('cells.every(c=>c.mine||c.open)'),setup);run('seekReplay(0);exitReplay()');
  assert.equal(p.saved.get('endlessweep-stats'),stats,setup+' replay must not alter stats');
  assert(!run('started||ended||paused||replayMode'),setup);
  // Real mine loss remains final; Zen remains playable.
  if(!run('zenMode')){
    run('playerReveal(Math.floor(height/2)*width+Math.floor(width/2));playerReveal(cells.findIndex(c=>c.mine))');
    assert(run('ended&&!lastReplay.won'),setup);
    const after=run('JSON.stringify(cells)');run('playerReveal(0);toggleFlag(0)');assert.equal(run('JSON.stringify(cells)'),after);
  }
}

// Regressions: decimal settings crashed neighbors; fresh custom route had no board.
const p=page(),{run,el}=p;
for(const [w,h,m] of [[9.5,8.9,10.8],[-4,999,99999],[40,30,1],[5,5,16]]){
  run(`customGame('custom-boundary',{width:${w},height:${h},mines:${m}});playerReveal(Math.floor(height/2)*width+Math.floor(width/2))`);
  assert(run('Number.isInteger(width)&&Number.isInteger(height)&&Number.isInteger(mineCount)'));
  assert(run('cells.length===width*height&&cells.filter(c=>c.mine).length===mineCount'));
  assert.equal(el('#customize').hidden,false);
}
// Keyboard follows the actual target even if focus arrived via Tab or right click.
run("difficulty.value='beginner';newGame('beginner','keys')");
el('#board').fire('keydown',{key:'f',target:el('#board').children[10]});
assert.equal(run('cells.findIndex(c=>c.flag)'),10);
el('#board').children[10].fire('focus');assert.equal(run('focused'),10);
run("mode='flag'");el('#board').fire('keydown',{key:'Enter',target:el('#board').children[11]});
assert(run('cells[11].flag&&!cells[11].open'));
run("mode='reveal'");el('#board').fire('keydown',{key:'ArrowRight',target:el('#board').children[11]});assert.equal(run('focused'),12);
// Touch long press followed by a browser contextmenu must toggle exactly once.
run("newGame('beginner','touch')");let cell=el('#board').children[10];cell.fire('pointerdown',{pointerType:'touch'});
for(const [id,fn] of [...p.timeouts]){p.timeouts.delete(id);fn()}
cell.fire('contextmenu');cell.fire('click');assert(run('cells[10].flag'));assert.equal(run('actions.length'),1);
// A new gesture must not inherit a cancelled gesture's click suppression.
cell.fire('pointerdown',{pointerType:'touch'});cell.fire('pointerup');cell.fire('contextmenu');assert(!run('cells[10].flag'));
// Contextmenu arriving before the long-press timer cancels the pending timer.
cell=el('#board').children[11];cell.fire('pointerdown',{pointerType:'touch'});cell.fire('contextmenu');assert.equal(p.timeouts.size,0);assert(run('cells[11].flag'));run("mode='flag'");cell.fire('click');assert(run('cells[11].flag'));run("mode='reveal'");
cell.fire('pointerdown',{pointerType:'touch'});run('restartGame()');assert.equal(p.timeouts.size,0);
// Custom inputs cannot replace a board during replay.
run("customGame('custom-replay',{width:9,height:9,mines:10});playerReveal(40);playerReveal(cells.findIndex(c=>c.mine));beginReplay()");
for(const id of ['#custom-game','#custom-width','#custom-height','#custom-mines'])assert.equal(el(id).disabled,true);
run('exitReplay()');for(const id of ['#custom-game','#custom-width','#custom-height','#custom-mines'])assert.equal(el(id).disabled,false);
// Repeated clicking on a fully processed number must not inflate action statistics.
run("newGame('beginner','empty-chord');playerReveal(40);cells.forEach((c,i)=>{if(c.mine)toggleFlag(i)})");
const clue=run('cells.findIndex((c,i)=>c.open&&c.count&&neighbors(i).every(n=>cells[n].open||cells[n].flag))');assert(clue>=0);
const count=run('actions.length');run(`chord(${clue});chord(${clue})`);assert.equal(run('actions.length'),count);
// Time Attack pause/resume and expiry on the actual callback, exactly one result.
run('timeAttackGame();playerReveal(40)');const tick=p.intervals.get(run('timer'));for(let i=0;i<17;i++)tick();run('togglePause()');tick();assert.equal(run('seconds'),17);run('togglePause()');for(let i=0;i<43;i++)tick();assert(run('ended&&seconds===60'));assert.equal(el('#time').textContent,0);
const stats=p.saved.get('endlessweep-stats');run('finishTimeAttack()');assert.equal(p.saved.get('endlessweep-stats'),stats);assert.equal(p.intervals.size,0);
console.log('All mode entry/completion/loss/pause/share/replay checks and custom, keyboard, touch, counter, expiry regressions passed');

// Pairwise mode transitions from a running, paused game: no timer, pause or panel leaks.
const starts=["difficulty.value='beginner';newGame('beginner','transitions')", "dailyGame()", "zenGame()", "noGuessGame()", "timeAttackGame()", "customGame()", "endlessGame()"];
for(const from of starts)for(const to of starts){
  const p=page();p.run(from);p.run("currentLevel==='daily'?chord(firstClick):playerReveal(Math.floor(height/2)*width+Math.floor(width/2));togglePause()");
  p.run(to);assert(!p.run('started||ended||paused||replayMode'),from+' -> '+to);assert.equal(p.intervals.size,0);
  assert.equal(p.el('#pause-cover').hidden,true);assert.equal(p.el('#time-status').hidden,!p.run('timeAttack'));
  assert.equal(p.el('#pan-controls').hidden,!p.run('endlessMode'));assert.equal(p.el('#endless-progress').hidden,!p.run('endlessMode'));
  assert.equal(p.el('#daily-calendar').hidden,!p.run("currentLevel==='daily'"));
}
console.log('49 pairwise running/paused mode transitions passed');
