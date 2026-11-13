import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from './worker.js';

const config=JSON.parse(fs.readFileSync('wrangler.jsonc','utf8'));
assert.equal(config.assets.run_worker_first,true,'Static assets must pass through the HTTPS redirect');
const points=[],env={GAME_EVENTS:{writeDataPoint:point=>points.push(point)},ASSETS:{fetch:()=>new Response('asset')}};
const send=data=>worker.fetch(new Request('https://endlessweep.com/api/events',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)}),env);
assert.equal((await send({event:'game_started',mode:'daily',device:'touch'})).status,204);
assert.equal(points.length,1);
assert.deepEqual(points[0].blobs,['game_started','daily','','touch']);
assert.deepEqual(points[0].doubles,[0,0,0,0,0]);
assert.equal((await send({event:'game_restarted',mode:'daily'})).status,204);
assert.equal((await send({event:'shared_visit',mode:'daily'})).status,204);
assert.equal((await send({event:'shared_game_started',mode:'daily'})).status,204);
assert.equal((await send({event:'game_completed',mode:'daily',result:'win',streak:3})).status,204);
assert.deepEqual(points.at(-1).doubles,[0,0,3,0,0]);
assert.equal((await send(null)).status,400);
assert.equal((await send({event:'unknown',mode:'daily'})).status,400);
for(const data of [null,[],{},true,{event:'game_started',mode:'daily',seconds:'60'},{event:'game_started',mode:'daily',device:{}},{event:'game_started',mode:'daily',result:[] }])assert.equal((await send(data)).status,400);
assert.equal((await worker.fetch(new Request('https://endlessweep.com/api/events',{method:'POST',body:'{'}),env)).status,400);
assert.equal((await send({event:'game_completed',mode:'endless',cleared:137,seconds:24})).status,204);
assert.deepEqual(points.at(-1).doubles,[24,0,0,137,0]);
const version=await worker.fetch(new Request('https://endlessweep.com/api/version'),{...env,RELEASE_COMMIT:'test-commit'});
assert.equal((await version.json()).commit,'test-commit');
assert.equal(version.headers.get('cache-control'),'no-store');
assert.equal((await send({event:'game_started',mode:'unknown'})).status,400);
for(const mode of ['mini','easy','endless'])assert.equal((await send({event:'game_started',mode})).status,204);
assert.equal((await send({event:'game_completed',mode:'time-attack-beginner',result:'finished',seconds:60})).status,204);
assert.equal((await worker.fetch(new Request('https://endlessweep.com/'),env)).status,200);
for(const url of ['http://endlessweep.com/','http://endlessweep.com/daily-minesweeper/?level=expert','http://endlessweep.com/easy-minesweeper/?level=mini&seed=shared','http://endlessweep.com/robots.txt','http://endlessweep.com/sitemap.xml']){
  const response=await worker.fetch(new Request(url),env);
  assert.equal(response.status,308);
  assert.equal(response.headers.get('location'),url.replace('http:','https:'));
}
console.log('Worker event checks passed');
