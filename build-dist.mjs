import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),dist=path.join(root,'dist');
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(dist);
for(const entry of fs.readdirSync(root,{withFileTypes:true})){
  if(entry.isFile()&&['index.html','robots.txt','sitemap.xml'].includes(entry.name))fs.copyFileSync(path.join(root,entry.name),path.join(dist,entry.name));
  if(entry.isDirectory()&&fs.existsSync(path.join(root,entry.name,'index.html'))){fs.mkdirSync(path.join(dist,entry.name));fs.copyFileSync(path.join(root,entry.name,'index.html'),path.join(dist,entry.name,'index.html'))}
}
console.log('Built dist');
