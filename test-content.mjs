import assert from 'node:assert/strict';
import fs from 'node:fs';

const slugs=['how-to-win-minesweeper','minesweeper-50-50','minesweeper-chord','minesweeper-difficulty','minesweeper-glossary','minesweeper-speed'];
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
console.log('Content build checks passed');
