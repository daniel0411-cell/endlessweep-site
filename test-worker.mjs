import assert from 'node:assert/strict';
import worker from './worker.js';

const points=[],env={GAME_EVENTS:{writeDataPoint:point=>points.push(point)},ASSETS:{fetch:()=>new Response('asset')}};
const send=data=>worker.fetch(new Request('https://endlessweep.com/api/events',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)}),env);
assert.equal((await send({event:'game_started',mode:'daily',device:'touch'})).status,204);
assert.equal(points.length,1);
assert.deepEqual(points[0].blobs,['game_started','daily','','touch']);
assert.equal((await send({event:'unknown',mode:'daily'})).status,400);
assert.equal((await send({event:'game_started',mode:'unknown'})).status,400);
assert.equal((await send({event:'game_completed',mode:'time-attack-beginner',result:'finished',seconds:60})).status,204);
assert.equal((await worker.fetch(new Request('https://endlessweep.com/'),env)).status,200);
for(const url of ['http://endlessweep.com/','http://endlessweep.com/daily-minesweeper/?level=expert']){
  const response=await worker.fetch(new Request(url),env);
  assert.equal(response.status,308);
  assert.equal(response.headers.get('location'),url.replace('http:','https:'));
}
console.log('Worker event checks passed');
