import assert from 'node:assert/strict';
import fs from 'node:fs';

const slugs=fs.readdirSync('content').filter(file=>file.endsWith('.md')).map(file=>fs.readFileSync(`content/${file}`,'utf8').match(/^slug: (.+)$/m)[1]);
const sitemap=fs.readFileSync('sitemap.xml','utf8');
for(const slug of slugs){
  const html=fs.readFileSync(`${slug}/index.html`,'utf8');
  assert.equal((html.match(/<title>/g)||[]).length,1);
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  assert(html.includes(`rel="canonical" href="https://endlessweep.com/${slug}/"`));
  assert(sitemap.includes(`https://endlessweep.com/${slug}/`));
  JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
}
assert(sitemap.includes('https://endlessweep.com/minesweeper-guides/'));
const home=fs.readFileSync('index.html','utf8');
for(const slug of ['daily-minesweeper','zen-minesweeper','custom-minesweeper']){
  const html=fs.readFileSync(`${slug}/index.html`,'utf8');
  assert(!html.includes('http-equiv="refresh"'));
  assert(html.includes(`rel="canonical" href="https://endlessweep.com/${slug}/"`));
  assert.equal(html.match(/const levels=/g)?.length,1);
  assert.equal(html.slice(html.indexOf('<style>'),html.indexOf('</style>')),home.slice(home.indexOf('<style>'),home.indexOf('</style>')));
  assert(!html.includes('id="mode-guide" hidden'));
  assert((html.match(/<section class="mode-guide"/g)||[]).length===1);
}
assert(fs.readFileSync('daily-minesweeper/index.html','utf8').includes('current UTC date'));
assert(fs.readFileSync('zen-minesweeper/index.html','utf8').includes('total mistakes'));
assert(fs.readFileSync('custom-minesweeper/index.html','utf8').includes('mine density'));
console.log('Content build checks passed');
