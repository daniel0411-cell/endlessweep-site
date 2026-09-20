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
console.log('Content build checks passed');
