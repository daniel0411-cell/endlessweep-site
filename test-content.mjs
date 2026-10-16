import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slugs=fs.readdirSync('content').filter(file=>file.endsWith('.md')).map(file=>fs.readFileSync(`content/${file}`,'utf8').match(/^slug: (.+)$/m)[1]);
const sitemap=fs.readFileSync('sitemap.xml','utf8');
for(const slug of slugs){
  const html=fs.readFileSync(`${slug}/index.html`,'utf8');
  assert.equal((html.match(/<title>/g)||[]).length,1);
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  assert(html.includes(`rel="canonical" href="https://endlessweep.com/${slug}/"`));
  assert(html.includes('property="og:image"'));
  assert(html.includes('name="twitter:card"'));
  assert(sitemap.includes(`https://endlessweep.com/${slug}/`));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert(schema['@graph']&&schema['@graph'].some(x=>x['@type']==='BreadcrumbList'));
}
const flagHtml=fs.readFileSync('how-to-flag-minesweeper/index.html','utf8');
const flagSchema=JSON.parse(flagHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert(flagSchema['@graph'].some(x=>x['@type']==='FAQPage'));
assert(sitemap.includes('https://endlessweep.com/minesweeper-guides/'));
assert(sitemap.includes('https://endlessweep.com/easy-minesweeper/'));
assert(fs.readFileSync('how-to-play-minesweeper/index.html','utf8').includes('id="first-game"'));
const tutorial=fs.readFileSync('how-to-play-minesweeper/index.html','utf8');
const snapshots=[...tutorial.matchAll(/<div class="walk-board"[^>]*>([\s\S]*?)<\/div>/g)];
assert.equal(snapshots.length,3);
const tutorialMines=[4,14,24];
for(const [stage,snapshot] of snapshots.entries()){
  const cells=[...snapshot[1].matchAll(/<span class="walk-cell ([^"]*)"[^>]*>([^<]*)<\/span>/g)];
  assert.equal(cells.length,25);
  for(const [i,cell] of cells.entries()){
    const flagged=(stage===1&&i===14)||(stage===2&&tutorialMines.includes(i));
    const open=i%5<4||(stage===2&&!tutorialMines.includes(i));
    const clue=tutorialMines.filter(j=>Math.abs(j%5-i%5)<=1&&Math.abs(Math.floor(j/5)-Math.floor(i/5))<=1).length;
    assert.equal(cell[2],flagged?'🚩':open?String(clue||''):'');
    if(open)assert(!tutorialMines.includes(i),'Illustration opens a mine');
  }
}
assert(sitemap.includes('https://endlessweep.com/minesweeper-cheat-sheet/'));
assert(sitemap.includes('https://endlessweep.com/minesweeper-practice/'));
assert(sitemap.includes('https://endlessweep.com/minesweeper-solver/'));
assert(fs.readFileSync('minesweeper-solver/index.html','utf8').includes('Calculate Probabilities'));
const guides=fs.readFileSync('minesweeper-guides/index.html','utf8');
for(const slug of ['how-to-play-minesweeper','minesweeper-controls','minesweeper-patterns','minesweeper-strategy','minesweeper-cheat-sheet'])assert(guides.includes(`href="/${slug}/"`));
const cheat=fs.readFileSync('minesweeper-cheat-sheet/index.html','utf8');
assert(cheat.includes('onclick="window.print()"'));
assert(cheat.includes('@media print'));
JSON.parse(cheat.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const patterns=fs.readFileSync('minesweeper-patterns/index.html','utf8');
for(const anchor of ['advanced-patterns','pattern-12','pattern-211','pattern-2112','pattern-corner-121'])assert(patterns.includes(`id="${anchor}"`));
const practice=fs.readFileSync('minesweeper-practice/index.html','utf8');
assert.equal((practice.match(/level:'/g)||[]).length,15);
for(const level of ['Basic','Intermediate','Advanced'])assert.equal((practice.match(new RegExp(`level:'${level}'`,'g'))||[]).length,5);
for(const marker of ['endlessweep-practice','Retry mistakes','practice_started','practice_completed'])assert(practice.includes(marker));
const home=fs.readFileSync('index.html','utf8');
for(const slug of ['easy-minesweeper','daily-minesweeper','zen-minesweeper','custom-minesweeper','time-attack-minesweeper','no-guess-minesweeper','minesweeper-unblocked']){
  const html=fs.readFileSync(`${slug}/index.html`,'utf8');
  assert(!html.includes('http-equiv="refresh"'));
  assert(html.includes(`rel="canonical" href="https://endlessweep.com/${slug}/"`));
  assert.equal(html.match(/const levels=/g)?.length,1);
  assert.equal(html.slice(html.indexOf('<style>'),html.indexOf('</style>')),home.slice(home.indexOf('<style>'),home.indexOf('</style>')));
  assert(!html.includes('id="mode-guide" hidden'));
  assert((html.match(/<section class="mode-guide"/g)||[]).length===1);
}
assert(fs.readFileSync('no-guess-minesweeper/index.html','utf8').includes('100% Solvable by Pure Logic'));
for(const slug of ['easy-minesweeper','no-guess-minesweeper']){
  const html=fs.readFileSync(`${slug}/index.html`,'utf8');
  assert(html.includes(`href="/${slug}/" aria-current="page"`));
  assert(!html.includes('<p id="page-subtitle">Play Beginner, Intermediate, or Expert Minesweeper'));
}
const sitePages=['index.html',...fs.readdirSync('.',{withFileTypes:true}).filter(entry=>entry.isDirectory()&&entry.name!=='dist'&&fs.existsSync(`${entry.name}/index.html`)).map(entry=>`${entry.name}/index.html`)];
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
assert.equal(new Set(urls).size,urls.length,'Duplicate sitemap URL');
for(const file of sitePages){
  const html=fs.readFileSync(file,'utf8'),canonical=`https://endlessweep.com/${file==='index.html'?'':path.dirname(file)+'/'}`;
  assert(html.includes(`rel="canonical" href="${canonical}"`),`${file}: canonical`);
  assert(urls.includes(canonical),`${file}: missing from sitemap`);
  assert(!/<meta[^>]+(?:noindex|nofollow)/i.test(html),`${file}: indexing blocked`);
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
    const url=new URL(href,canonical);
    if(url.hostname!=='endlessweep.com')continue;
    assert.equal(url.protocol,'https:',`${file}: insecure link ${href}`);
    const target=path.join('.',url.pathname,url.pathname.endsWith('/')?'index.html':'');
    assert(fs.existsSync(target),`${file}: broken link ${href}`);
    if(url.hash&&target.endsWith('.html'))assert(fs.readFileSync(target,'utf8').includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),`${file}: missing anchor ${href}`);
  }
}
for(const url of urls)assert(sitePages.includes(new URL(url).pathname.slice(1)+'index.html'),`Sitemap target missing: ${url}`);
assert(fs.readFileSync('minesweeper-unblocked/index.html','utf8').includes('Play Free at School or Work'));
const daily=fs.readFileSync('daily-minesweeper/index.html','utf8');
for(const marker of ['data-daily-level="beginner"','data-daily-level="intermediate"','data-daily-level="expert"','seven-day strip'])assert(daily.includes(marker));
assert(fs.readFileSync('zen-minesweeper/index.html','utf8').includes('total mistakes'));
assert(fs.readFileSync('custom-minesweeper/index.html','utf8').includes('mine density'));
const difficulty=fs.readFileSync('minesweeper-difficulty/index.html','utf8');
for(const marker of ['30 x 24 with 130 mines','What changes on a large Minesweeper grid?','/custom-minesweeper/?seed=large-board'])assert(difficulty.includes(marker));
const statistics=fs.readFileSync('minesweeper-statistics/index.html','utf8');
for(const marker of ['How to read your Minesweeper statistics','Endlessweep Efficiency is not 3BV/s','Local data and privacy','daily-beginner','daily-intermediate','daily-expert','time-attack-beginner','time-attack-intermediate'])assert(statistics.includes(marker));
const gameModes=fs.readFileSync('game-modes/index.html','utf8');
for(const marker of ['/time-attack-minesweeper/','/minesweeper-practice/','/minesweeper-statistics/','/minesweeper-logic/','seven days of local results'])assert(gameModes.includes(marker));
const timeAttack=fs.readFileSync('time-attack-minesweeper/index.html','utf8');
for(const marker of ['Score as many safe squares as you can in 60 seconds','timeAttackGame','Safe squares score 1 point'])assert(timeAttack.includes(marker));
console.log('Content build checks passed');
