import assert from 'node:assert/strict';
import {page} from './test-helpers.mjs';
for(const level of ['mini','easy','beginner','intermediate','expert'])for(const edge of [false,true]){
  const source=page();source.run(`newGame('${level}','opening-${level}');playerReveal(${edge?'width*height-1':'0'})`);
  const url=new URL(source.run('challengeUrl()')),target=page();
  target.ctx.location.search=url.search;target.run('loadShared()');
  assert.equal(target.run('firstClick'),source.run('firstClick'));
  assert.equal(target.run('cells.map(c=>c.mine).join()'),source.run('cells.map(c=>c.mine).join()'));
  assert.equal(target.run('cells.map(c=>c.open).join()'),source.run('cells.map(c=>c.open).join()'));
}
for(const setup of ["customGame('custom-opening',{width:11,height:12,mines:20})","zenGame('intermediate','zen-opening')","noGuessGame('beginner','verified-opening')"]){
  const source=page();source.run(`${setup};playerReveal(40)`);assert.equal(source.run('firstClick'),40);
  const target=page();target.ctx.location.search=new URL(source.run('challengeUrl()')).search;target.run('loadShared()');
  for(const expr of ['currentLevel','firstClick','cells.map(c=>c.mine).join()','cells.map(c=>c.open).join()'])assert.equal(target.run(expr),source.run(expr));
  const events=await Promise.all(target.beacons.map(async b=>JSON.parse(await b.text())));
  assert.equal(events.filter(e=>e.event==='shared_game_started').length,1);
  assert(events.findIndex(e=>e.event==='shared_visit')<events.findIndex(e=>e.event==='game_started'));
}
for(const first of ['', '-1','1.5','81','9999999999999999999','Infinity','0x10','1e1',' 1']){
  const g=page();g.ctx.location.search='?seed=valid&level=beginner&first='+encodeURIComponent(first);g.run('loadShared()');assert.equal(g.run('started'),false,first);
}
for(const query of ['?seed=valid&level=beginner','?seed=bad%20seed&level=beginner&first=0','?seed=valid&level=custom&width=0&height=9&mines=10&first=0','?mode=time-attack&seed=valid&first=0']){
  const g=page();g.ctx.location.search=query;g.run('loadShared()');assert.equal(g.run('started'),false,query);
}
const failure=page();failure.ctx.location.search='?mode=no-guess&seed=valid&level=beginner&first=40';failure.run('plant=()=>false;loadShared()');assert.equal(failure.run('started'),false);assert.equal(failure.run('firstClick'),null);
const daily=page();daily.ctx.location.search='?mode=daily&seed=valid&first=0';daily.run('loadShared()');assert.equal(daily.run('firstClick'),40);assert.equal(daily.run('started'),false);
console.log('Finite shared openings, legacy/invalid links, referral order and generation failure passed');
