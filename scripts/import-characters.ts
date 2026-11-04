import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { travelTypes } from '../src/content/types';
// Approved contact sheet: extract portraits only, excluding the printed codes/gutters.
// Keep the source and the original SVG implementation for reversible replacement.
const columns = [[10,310],[320,617],[627,927],[938,1238]];
const rows = [[9,285],[325,600],[643,917],[958,1223]];
await mkdir('public/images/types',{recursive:true});
for (const [i,t] of travelTypes.entries()) {
  const [left,right]=columns[i%4], [top,bottom]=rows[Math.floor(i/4)];
  await sharp('docs/character-designs/human-lineup-v1.png')
    .extract({left,top,width:right-left,height:bottom-top})
    .png().toFile('public/images/types/'+t.code.toLowerCase()+'.png');
}
console.log('Extracted 16 approved portraits.');
