import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { loadEnv } from 'vite';
import sharp from 'sharp';
import { travelTypes } from '../src/content/types';
import { characterSvg } from '../src/components/Character';
import { recommendations, typeVector, type Spot } from '../src/lib/diagnosis';
const env={...loadEnv('production',process.cwd(),''),...process.env};
const base=env.BASE_PATH||'/';
if(!base.startsWith('/')||!base.endsWith('/'))throw new Error('BASE_PATH must start and end with /');
const origin=env.SITE_URL?.replace(/\/$/,'');
if(origin&&!/^https:\/\//.test(origin))throw new Error('SITE_URL must use https');
if(process.env.GITHUB_ACTIONS==='true'&&!origin)throw new Error('SITE_URL is required for deployed OGP');
const url=(path:string)=>origin?`${origin}/${path}`:`${base}${path}`;
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const template=await readFile('dist/index.html','utf8');
const data=JSON.parse(await readFile('public/data/spots.json','utf8')) as {spots:Spot[]};
await mkdir('dist/images/og',{recursive:true});
await mkdir('dist/images/types',{recursive:true});
function meta(title:string,description:string,path:string,image:string){
  return `<meta property="og:type" content="website"/><meta property="og:locale" content="ja_JP"/><meta property="og:site_name" content="とやま旅タイプ"/><meta property="og:title" content="${escape(title)}"/><meta property="og:description" content="${escape(description)}"/><meta property="og:url" content="${escape(url(path))}"/><meta property="og:image" content="${escape(url(image))}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta name="twitter:card" content="summary_large_image"/><link rel="canonical" href="${escape(url(path))}"/>`;
}
function html(title:string,description:string,path:string,img:string,body:string){
  return template.replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`).replace(/<meta name="description"[^>]*\/>/,`<meta name="description" content="${escape(description)}"/>`).replace('</head>',meta(title,description,path,img)+'</head>').replace('<div id="root"></div>',`<div id="root">${body}</div>`);
}
for(const t of travelTypes){
  const path=`types/${t.code.toLowerCase()}/`,character=characterSvg(t.code,t.color);
  await mkdir(`dist/${path}`,{recursive:true});
  await writeFile(`dist/images/types/${t.code.toLowerCase()}.svg`,character);
  let customImage=false;
  try{await access(`public/images/types/${t.code.toLowerCase()}.png`);customImage=true;}catch{}
  const embedded=customImage?`<image x="795" y="143" width="330" height="312" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${(await readFile(`public/images/types/${t.code.toLowerCase()}.png`)).toString('base64')}"/>`:character.replace('<svg ', '<svg x="795" y="143" ').replace('width="360" height="340"','width="330" height="312"');
  const og=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#ffffff"/><rect x="40" y="40" width="1120" height="550" rx="28" fill="none" stroke="#c7d2c2"/><text x="85" y="115" fill="#244c44" font-size="25" font-family="Yu Gothic, Noto Sans CJK JP, sans-serif">とやま旅タイプ / あなたらしい旅を。</text><text x="85" y="240" fill="${t.color}" font-size="69" font-family="Georgia, serif" letter-spacing="12">${t.code}</text><text x="85" y="330" fill="#244c44" font-size="49" font-family="Yu Gothic, Noto Sans CJK JP, sans-serif" font-weight="bold">${escape(t.name)}</text><text x="85" y="410" fill="#617166" font-size="26" font-family="Yu Gothic, Noto Sans CJK JP, sans-serif">${escape(t.strengths[0])}</text><text x="85" y="455" fill="#617166" font-size="26" font-family="Yu Gothic, Noto Sans CJK JP, sans-serif">${escape(t.strengths[1])}</text><text x="85" y="547" fill="#a46b43" font-size="24" font-family="Yu Gothic, Noto Sans CJK JP, sans-serif">20の質問で、富山の旅を見つけよう。</text>${embedded}</svg>`;
  await sharp(Buffer.from(og)).png().toFile(`dist/images/og/${t.code.toLowerCase()}.png`);
  const picks=recommendations(typeVector(t.code),data.spots);
  const staticBody=`<main style="max-width:900px;margin:3rem auto;padding:1rem"><a href="${base}">とやま旅タイプ</a><p>${t.code}</p><h1>${escape(t.name)}</h1><img width="220" height="208" src="${base}images/types/${t.code.toLowerCase()}.svg" alt="旅のキャラクター"/><p>${escape(t.description)}</p><h2>このタイプにおすすめの観光地</h2><ul>${picks.primary.map(s=>`<li><a href="${escape(s.url)}">${escape(s.name)}</a></li>`).join('')}</ul><a href="${base}">20問の診断をはじめる</a><noscript><p>診断を利用するにはJavaScriptを有効にしてください。</p></noscript></main>`;
  await writeFile(`dist/${path}index.html`,html(`${t.code} ${t.name}｜とやま旅タイプ`,t.description,path,`images/og/${t.code.toLowerCase()}.png`,customImage?staticBody.replace(`${t.code.toLowerCase()}.svg`,`${t.code.toLowerCase()}.png`):staticBody));
}
await mkdir('dist/types',{recursive:true});
await writeFile('dist/types/index.html',html('16の旅タイプ｜とやま旅タイプ','あなたらしい旅を、富山で。16タイプの紹介。','types/','images/og/nagm.png',`<main><h1>16の旅タイプ</h1><ul>${travelTypes.map(t=>`<li><a href="${base}types/${t.code.toLowerCase()}/">${t.code} ${escape(t.name)}</a></li>`).join('')}</ul></main>`));
await writeFile('dist/index.html',html('とやま旅タイプ｜あなたらしい旅を見つけよう','20の質問で見つける、あなたらしい富山の旅。','','images/og/nagm.png','<noscript>診断を利用するにはJavaScriptを有効にしてください。</noscript>'));
await writeFile('dist/404.html',`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ページが見つかりません</title><main><h1>ページが見つかりません</h1><a href="${base}">とやま旅タイプのトップへ</a></main></html>`);
await writeFile('dist/.nojekyll','');
console.log(`Generated 16 static type pages + PNG OGPs. ${origin?'Production canonical URLs configured.':'Local build: public OGP URLs await SITE_URL.'}`);


await mkdir('dist/about',{recursive:true});
await writeFile('dist/about/index.html',html('おすすめの仕組み｜とやま旅タイプ','あなたの旅の好みと、富山の観光アンケートを照らし合わせて行き先を提案する仕組みをご紹介。','about/','images/og/nagm.png','<main><h1>おすすめの仕組み</h1><p>あなたの旅の好みと、富山の観光アンケートを照らし合わせて行き先を提案します。</p><noscript>詳しい説明を読むにはJavaScriptを有効にしてください。</noscript></main>'));

