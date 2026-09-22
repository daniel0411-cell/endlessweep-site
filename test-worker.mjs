import assert from 'node:assert/strict';
import worker from './worker.js';

const points=[],env={GAME_EVENTS:{writeDataPoint:point=>points.push(point)},ASSETS:{fetch:()=>new Response('asset')}};
const send=data=>worker.fetch(new Request('https://endlessweep.com/api/events',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)}),env);
assert.equal((await send({event:'game_started',mode:'daily',device:'touch'})).status,204);
assert.equal(points.length,1);
assert.deepEqual(points[0].blobs,['game_started','daily','','touch']);
assert.equal((await send({event:'unknown',mode:'daily'})).status,400);
assert.equal((await send({event:'game_started',mode:'unknown'})).status,400);
assert.equal((await worker.fetch(new Request('https://endlessweep.com/'),env)).status,200);
console.log('Worker event checks passed');
