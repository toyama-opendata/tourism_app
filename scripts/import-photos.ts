import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const source=path.resolve('../toyama-trip-prototype/public');
const raw=await readFile(path.join(source,'photos.js'),'utf8');
const photos=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
const data=JSON.parse(await readFile('public/data/spots.json','utf8'));
const manifest:Record<string,{src:string;alt:string;credit:string}>={};
const audit:unknown[]=[];const missing:string[]=[];
await mkdir('public/images/spots',{recursive:true});
for(const spot of data.spots){
  const p=photos[spot.name];if(!p){missing.push(spot.name);continue;}
  const from=path.resolve(source,p.card.src);
  if(!from.startsWith(source+path.sep))throw new Error('Invalid source path');
  const src=`images/spots/${spot.id}.webp`;
  await copyFile(from,`public/${src}`);
  const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
  const original=await readFile(from),copied=await readFile(`public/${src}`);
  if(hash(original)!==hash(copied))throw new Error('Photo copy mismatch');
  manifest[spot.id]={src,alt:p.alt||`${spot.name}の写真`,credit:p.credit||''};
  audit.push({id:spot.id,name:spot.name,source:p.card.src,target:src,sha256:hash(copied),bytes:copied.length,credit:p.credit||'',creditStatus:p.creditStatus,permission:'2026-11-01 ユーザーから既存アプリ写真の転用指示'});
}
await writeFile('src/content/spotPhotos.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile('docs/photo-reuse.json',JSON.stringify({date:'2026-11-01',copied:audit.length,missing,files:audit},null,2)+'\n');
console.log(JSON.stringify({copied:audit.length,missing},null,2));
