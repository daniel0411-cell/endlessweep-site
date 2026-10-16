import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  constructor(){this.children=[];this.dataset={};this.style={};this.handlers={};this.attrs={};this.value='';this.className='';this.hidden=false;this.disabled=false;this.textContent='';this.classList={toggle(){},contains:()=>false,add(){}}}
  set innerHTML(value){this.children=[]}get innerHTML(){return ''}
  setAttribute(name,value){this.attrs[name]=value}removeAttribute(name){delete this.attrs[name]}
  addEventListener(name,fn){(this.handlers[name]??=[]).push(fn)}
  appendChild(el){this.children.push(el)}querySelectorAll(){return []}focus(){}
}
const elements=new Map(),saved=new Map();
const document={documentElement:new Element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,new Element());return elements.get(selector)},querySelectorAll(){return []},createElement(){return new Element()},addEventListener(){}};
document.querySelector('#difficulty').value='beginner';
for(const [id,value] of [['width',9],['height',9],['mines',10]])document.querySelector('#custom-'+id).value=value;
const ctx=vm.createContext({document,window:{addEventListener(){}},location:{pathname:'/',search:''},URLSearchParams,crypto:globalThis.crypto,performance:{now:()=>0},navigator:{},Blob,matchMedia:()=>({matches:false}),localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},console});
const html=fs.readFileSync('index.html','utf8');
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
const run=s=>vm.runInContext(s,ctx);
run("dailyGame('expert');restartGame()");
assert.equal(run('currentLevel'),'daily');
assert.match(run('dailyDate'),/^\d{4}-\d{2}-\d{2}$/);
assert.equal(run('gameSeed'),`daily-${run('dailyDate')}-expert`);
assert.equal(document.querySelector('#daily-status').hidden,false);
run("zenGame('intermediate');zenMistakes=4;started=true;seconds=12;restartGame()");
assert.equal(run('currentLevel'),'zen-intermediate');assert.equal(run('zenMistakes'),0);
assert.equal(JSON.parse(saved.get('endlessweep-stats')).history[0].mistakes,4);
run("timeAttackGame('intermediate');timeScore=25;started=true;seconds=8;restartGame()");
assert.equal(run('currentLevel'),'time-attack-intermediate');assert.equal(run('timeScore'),0);
assert.equal(JSON.parse(saved.get('endlessweep-stats')).history[0].score,25);
assert.equal(document.querySelector('#time').textContent,60);
run("noGuessGame('expert');restartGame()");assert.equal(run('noGuessMode'),true);
run("const replay={width:9,height:9,mines:10,minesAt:[0],actions:[],won:false};beginReplay(replay);restartGame()");
assert.equal(run('replayMode'),true);
for(const id of ['#face-btn','#difficulty','#new-game','#daily','#pause'])assert.equal(document.querySelector(id).disabled,true,id);
run('exitReplay()');assert.equal(run('replayMode'),false);assert.equal(run('noGuessMode'),true);
for(const id of ['#face-btn','#difficulty','#new-game','#daily','#pause'])assert.equal(document.querySelector(id).disabled,false,id);
run("customGame('custom-seed',{width:11,height:12,mines:20});started=true;restartGame()");
assert.equal(run('currentLevel'),'custom');assert.equal(run('width'),11);assert.equal(run('height'),12);assert.equal(run('mineCount'),20);assert.equal(run('started'),false);

// Exercise the real engine, including completed results and share-link loading.
for(const [level,w,h,mines] of [['mini',5,5,3],['easy',7,7,6],['beginner',9,9,10]]){
  run(`difficulty.value='${level}';newGame('${level}','small-board');playerReveal(0)`);
  assert.equal(run('width'),w);assert.equal(run('height'),h);assert.equal(run('mineCount'),mines);
  assert.equal(run('cells[0].mine'),false);
  const layout=run('cells.map(c=>c.mine).join()'),url=run('challengeUrl()');
  assert.equal(new URL(url).searchParams.get('level'),level);
  ctx.location.pathname='/';ctx.location.search=new URL(url).search;
  run('loadShared();playerReveal(0)');assert.equal(run('cells.map(c=>c.mine).join()'),layout);
  run('{const flagged=cells.findIndex(c=>c.mine);toggleFlag(flagged);toggleFlag(flagged)}');
  run('cells.forEach((c,i)=>{if(!c.mine&&!c.open)playerReveal(i)})');
  assert.equal(run('ended'),true);assert.equal(run('lastReplay.won'),true);
  assert.equal(run('lastReplay.level'),level);
  assert.equal(JSON.parse(saved.get('endlessweep-stats'))[level].wins,1);
  run('beginReplay();seekReplay(lastReplay.actions.length)');
  assert.equal(run('cells.filter(c=>c.open&&!c.mine).length'),w*h-mines);
  run('exitReplay();restartGame()');assert.equal(run('currentLevel'),level);
}
ctx.location.pathname='/easy-minesweeper/';ctx.location.search='';run('loadShared()');assert.equal(run('currentLevel'),'easy');
ctx.location.search='?level=mini';run('loadShared()');assert.equal(run('currentLevel'),'mini');
ctx.location.search='?level=mini&seed=bad%20seed';run('loadShared()');assert.equal(run('currentLevel'),'beginner');
ctx.location.pathname='/';ctx.location.search='?level=constructor&seed=valid';run('loadShared()');assert.equal(run('currentLevel'),'beginner');
for(const game of ['dailyGame','zenGame','noGuessGame']){run(`${game}('mini')`);assert.equal(run('width'),9)}

const luminance=hex=>{const [r,g,b]=hex.match(/../g).map(n=>parseInt(n,16)/255).map(n=>n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4);return r*0.2126+g*0.7152+b*0.0722};
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+0.05)/(Math.min(luminance(a),luminance(b))+0.05);
for(const dark of [false,true])for(let n=1;n<=8;n++){
  const prefix=dark?':root.dark ':'';
  const color=html.match(new RegExp(prefix.replace('.','\\.')+'\\.n'+n+' \\{ color: #([a-f0-9]{6});'))[1];
  assert(contrast(color,dark?'0f172a':'f8fafc')>=4.5,`${prefix}n${n} contrast`);
}
console.log('UI restart, replay controls, previous-result preservation and all number colors passed');
