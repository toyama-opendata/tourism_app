import { readFile, readdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { travelTypes } from '../src/content/types';
const origin=process.env.SITE_URL?.replace(/\/$/,'');
for(const t of travelTypes){
  const code=t.code.toLowerCase(),html=await readFile(`dist/types/${code}/index.html`,'utf8');
  assert.ok(html.includes(t.name));assert.ok(html.includes('property="og:image"'));
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
  if(origin){assert.ok(html.includes(`content="${origin}/types/${code}/"`));assert.ok(html.includes(`content="${origin}/images/og/${code}.png"`));}
  const png=await sharp(`dist/images/og/${code}.png`).metadata();assert.equal(png.width,1200);assert.equal(png.height,630);
}
async function walk(dir:string):Promise<string[]>{const paths=[];for(const name of await readdir(dir)){const p=`${dir}/${name}`;paths.push(...(await stat(p)).isDirectory()?await walk(p):[p]);}return paths;}
const paths=await walk('dist');
assert.ok(!paths.some(p=>/\.(csv|xlsx|py|gs)$/.test(p)||p.includes('data/raw')||p.includes('.env')||p.includes('.openai')));
assert.ok(paths.includes('dist/data/spots.json'));assert.ok(paths.includes('dist/types/index.html'));assert.ok(paths.includes('dist/.nojekyll'));
console.log('Verified 16 static pages, 16 OGP PNGs, and aggregate-only deployment files.');
