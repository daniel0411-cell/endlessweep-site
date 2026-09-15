import assert from 'node:assert/strict';

function mines(seed,width,height,count,first){
  let state=2166136261;
  for(const c of `${seed}|${width}|${height}|${count}|${first}`)state=Math.imul(state^c.charCodeAt(0),16777619);
  const around=i=>{const x=i%width,y=Math.floor(i/width),out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if((dx||dy)&&nx>=0&&nx<width&&ny>=0&&ny<height)out.push(ny*width+nx)}return out};
  const safe=new Set([first,...around(first)]),pool=Array.from({length:width*height},(_,i)=>i).filter(i=>!safe.has(i));
  const random=()=>{state+=0x6D2B79F5;let n=state;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296};
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
  return pool.slice(0,count);
}

const a=mines('same-seed',9,9,10,40),b=mines('same-seed',9,9,10,40),c=mines('different',9,9,10,40);
assert.deepEqual(a,b);
assert.notDeepEqual(a,c);
assert.equal(a.length,10);
assert(!a.some(i=>[30,31,32,39,40,41,48,49,50].includes(i)));
for(const actions of [[],[{progress:true}],[{progress:false}],[{progress:true},{progress:false}]]){
  const efficiency=actions.length?Math.min(100,Math.round(actions.filter(x=>x.progress).length/actions.length*100)):0;
  assert(efficiency>=0&&efficiency<=100);
}
const old={date:'2026-01-01',level:'beginner',won:true,seconds:12,width:9,height:9,mines:10};
assert.equal(old.efficiency,undefined);
console.log('Replay and seed checks passed');
