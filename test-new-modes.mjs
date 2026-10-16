import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const home=fs.readFileSync('index.html','utf8');
const funcs=names=>names.map(name=>home.split('\n').find(line=>line.startsWith(`function ${name}(`))).join('\n');
const ctx=vm.createContext({URLSearchParams,console,crypto:globalThis.crypto});
ctx.customize={};ctx.dailyDate=null;
ctx.document={querySelectorAll:()=>[]};
ctx.replayMode=false;
vm.runInContext(`let width=9,height=9,mineCount=10,cells=[],noGuessMode=true,randomState=0,calls=0;${funcs(['neighbors','seedRandom','random','plant','isSolvable'])}
function reset(){cells=Array.from({length:81},()=>({mine:false}));seedRandom('test')}
reset();const realSolver=isSolvable;isSolvable=()=>{calls++;return false};
if(plant(40)!==false||calls!==150||cells.some(c=>c.mine))throw Error('Unverified board accepted');
isSolvable=realSolver;reset();if(!plant(40))throw Error('Verified generation failed');const layout=JSON.stringify(cells.map(c=>c.mine));reset();plant(40);if(JSON.stringify(cells.map(c=>c.mine))!==layout)throw Error('Seed not deterministic');`,ctx);
vm.runInContext(`let started=false,ended=false,paused=false,firstClick=null,gameSeed='audit',startedAt=0,message={},level='expert',currentLevel='no-guess-expert',zenMode=false,timeAttack=false,dailyDifficulty='expert',difficulty={value:'expert'},levels={beginner:[9,9,10],intermediate:[16,16,40],expert:[30,16,99]};let updateBest=()=>{},resetBoard=()=>{},abandon=()=>{},makeSeed=()=> 'new-seed';${funcs(['newGame','noGuessGame','restartGame','challengeUrl'])}
const entryMode=()=> 'no-guess';restartGame();if(!noGuessMode||currentLevel!=='no-guess-expert')throw Error('Restart lost mode');
gameSeed='audit';const url=challengeUrl();if(!url.includes('mode=no-guess')||!url.includes('level=expert')||!url.includes('seed=audit'))throw Error('Invalid share URL');`,ctx);
vm.runInContext(`${funcs(['start'])}
plant=()=>false;let performance={now:()=>0},track=()=>{throw Error('Failed board tracked')};
if(start(0)!==false||started)throw Error('Failed generation started game');`,ctx);
for(const name of ['playerReveal','toggleFlag'])assert(home.split('\n').find(l=>l.startsWith(`function ${name}(`)).includes('if(!started&&!start(i))return;'));
vm.runInContext(`let location={search:'?mode=no-guess&seed=shared&level=expert'},setPageMode=()=>{},loadReplays=()=>[],beginReplay=()=>{};${funcs(['loadShared'])}
loadShared();if(gameSeed!=='shared'||currentLevel!=='no-guess-expert')throw Error('Shared seed not loaded');
location.search='?mode=no-guess&seed=%3Cbad%3E&level=expert';loadShared();if(noGuessMode||currentLevel!=='beginner')throw Error('Invalid seed accepted');`,ctx);
let shared='';ctx.navigator={clipboard:{writeText:text=>{shared=text;return Promise.resolve()}}};
vm.runInContext(`let lastReplay={won:false},seconds=12,zenMistakes=3,timeAttackLevel='beginner',dailyDate='2026-10-15',loadStats=()=>({});track=()=>{};${funcs(['shareResult'])}
currentLevel='daily';ended=true;shareResult();`,ctx);
assert(shared.includes('Lost in 12s'));assert(!shared.includes('Clear · 0'));
assert(shared.includes('⬛'));
vm.runInContext("currentLevel='daily';ended=true;lastReplay={won:true};shareResult()",ctx);
assert(shared.includes('🟩🟩🟩🟩🟩'));
vm.runInContext("currentLevel='zen-beginner';zenMode=true;lastReplay={won:true};shareResult()",ctx);
assert(shared.includes('Clear · 3 mistakes'));
class Element{
 constructor(){this.children=[];this.dataset={};this.style={};this.handlers={};this.classList={add(){}};this.textContent=''}
 set innerHTML(v){this.html=v;this.children=[]}get innerHTML(){return this.html}
 setAttribute(){}addEventListener(k,fn){this.handlers[k]=fn}appendChild(el){this.children.push(el)}focus(){this.focused=true}
}
const els=new Map();const document={querySelector:s=>{if(!els.has(s))els.set(s,new Element());return els.get(s)},querySelectorAll:()=>[],createElement:()=>new Element()};
const solver=vm.createContext({document,console});
const script=fs.readFileSync('minesweeper-solver/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
vm.runInContext(script,solver);
assert(els.get('#summary-text').textContent.includes('Ambiguous: 2'));
vm.runInContext("curGrid=JSON.parse(JSON.stringify(presets.p121));calculate()",solver);
assert(els.get('#summary-text').textContent.includes('Safe squares: 1, Proven mines: 2'));
vm.runInContext("curGrid=JSON.parse(JSON.stringify(presets.p1221));calculate()",solver);
assert(els.get('#summary-text').textContent.includes('Safe squares: 2, Proven mines: 2'));
let prevented=false;
els.get('#grid').children[0].handlers.keydown({key:'8',preventDefault(){prevented=true}});
assert(prevented);assert.equal(vm.runInContext('curGrid[0][0]',solver),8);
assert(els.get('#grid').children[0].focused);
els.get('#grid').children[0].handlers.keydown({key:'Delete',preventDefault(){}});
assert.equal(vm.runInContext('curGrid[0][0]',solver),null);
vm.runInContext('renderGrid([{r:0,c:0,mineProb:0,safeProb:100,safe:false,mine:false}])',solver);
assert(!els.get('#grid').children[0].innerHTML.includes('SAFE'));
els.get('#btn-col-add').handlers.click();
assert.equal(vm.runInContext('curGrid[0].length',solver),5);
els.get('#btn-col-sub').handlers.click();
assert.equal(vm.runInContext('curGrid[0].length',solver),4);
console.log('New mode, share, generation, emoji tiles, and solver behavior checks passed');
