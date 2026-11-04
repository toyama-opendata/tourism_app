import sharp from 'sharp';
import {travelTypes} from '../src/content/types';
import {characterSvg} from '../src/components/Character';
const tiles = await Promise.all(travelTypes.map(async(t,i)=>{
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="330">${characterSvg(t.code,t.color).replace('width="360" height="340"','x="24" y="10" width="252" height="238"')}<text x="150" y="279" text-anchor="middle" fill="#293f39" font-family="Yu Gothic, sans-serif" font-size="18" font-weight="bold">${t.code}</text><text x="150" y="307" text-anchor="middle" fill="#293f39" font-family="Yu Gothic, sans-serif" font-size="17">${t.name}</text></svg>`;
 return {input:await sharp(Buffer.from(svg)).png().toBuffer(),left:(i%4)*300,top:Math.floor(i/4)*330};
}));
await sharp({create:{width:1200,height:1320,channels:4,background:'#faf8f2'}}).composite(tiles).png().toFile('docs/character-lineup.png');
