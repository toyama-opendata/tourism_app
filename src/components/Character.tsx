// Original flat travel companions. Each full type has its own silhouette and equipment.
const cream = '#faf4e6', gold = '#e7b967', ink = '#293f39';
const path = (d:string, fill:string) => `<path d="${d}" fill="${fill}"/>`;
const line = (d:string, stroke=ink, width=4) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const circle = (x:number,y:number,r:number,fill:string) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const rect = (x:number,y:number,w:number,h:number,r:number,fill:string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
type Design = {body:string; head:string; prop:string; detail?:string; eyes?:'happy'|'glasses'|'wink'};
function designFor(code:string,c:string):Design {
  const mountain=path('M78 246L150 72Q174 35 198 72L280 246Q290 275 257 277H101Q66 276 78 246',c);
  const snow=path('M128 119L150 72Q174 35 198 72L221 119L197 110L176 131L153 110Z',cream);
  const round=rect(94,104,174,174,65,c);
  const house=rect(94,105,174,173,43,c);
  const roof=path('M74 112L180 48L286 112Z','#d49b63');
  const designs:Record<string,Design>={
    NAGM:{body:mountain,head:snow,prop:path('M270 219H318L309 247H279Z','#d49b63')+path('M272 218Q294 188 316 218Z',cream)+rect(287,207,13,13,2,ink),detail:path('M130 143L180 155L226 140L213 161L181 168L141 157Z',gold)},
    NAGH:{body:path('M90 244L126 104Q144 65 176 104Q210 46 231 112L274 250Q280 277 250 278H113Q84 275 90 244',c),head:path('M119 116Q164 68 208 107Q182 137 142 125Z','#9bbd84')+line('M139 117l51-10','#5b7954'),prop:path('M266 219H320L311 254H276Z','#c6955b')+line('M278 220Q292 189 308 219','#aa7946',5)+circle(283,220,10,'#bc6b4e')+circle(303,220,10,gold),eyes:'wink'},
    NAEM:{body:mountain,head:snow+rect(129,111,94,17,7,gold)+rect(164,105,25,27,7,ink)+circle(176,118,8,cream),prop:line('M293 168l-12 124','#b18153',8)+line('M280 179h24',ink,6),detail:line('M119 168l17 85M240 168l-17 85',gold,9)},
    NAEH:{body:path('M91 249L116 125Q128 72 178 77Q229 75 244 126L270 249Q279 277 247 278H114Q82 277 91 249',c),head:path('M116 128Q119 60 180 65Q239 69 244 128Z','#c69b65')+rect(100,117,158,16,8,'#b88954')+rect(136,102,88,15,3,ink),prop:rect(265,207,21,39,6,ink)+rect(292,207,21,39,6,ink)+rect(282,218,15,10,3,ink)+circle(276,242,7,'#93b3ae')+circle(303,242,7,'#93b3ae')},
    NRGM:{body:path('M86 231Q77 116 176 110Q277 108 275 230Q280 279 235 281H127Q88 280 86 231',c),head:path('M124 113L119 78Q176 46 235 78L228 113Z',cream)+rect(117,104,120,17,6,ink),prop:path('M265 225Q293 240 321 225L308 252H278Z','#d49b63')+path('M276 218Q289 201 303 218L314 209V228L303 221Q289 235 276 218',cream),detail:line('M125 253q25-12 50 0t50 0',cream,6),eyes:'happy'},
    NRGH:{body:round,head:path('M85 128Q180 30 276 128Z','#d0ad6e')+line('M120 119h123M143 98h74','#b38b4b',5),prop:rect(273,209,37,37,7,'#a8b58e')+line('M310 216q21 0 0 20','#a8b58e',7)+line('M283 194q-7-9 0-17','#93a89b',3),detail:path('M139 244H222V277H139Z','#c6d5b1'),eyes:'happy'},
    NREM:{body:path('M94 237Q93 166 124 112Q146 69 180 78Q215 70 240 113Q272 172 267 244Q267 279 230 279H131Q95 276 94 237',c),head:path('M113 129L125 83Q180 65 237 83L247 129Z','#b3c9bf')+rect(102,122,157,14,7,'#8ba99d'),prop:circle(292,204,22,gold)+circle(292,204,15,'#e1ebe4')+line('M279 222l-15 25','#b88954',9),detail:rect(150,247,61,19,5,'#b3c9bf'),eyes:'glasses'},
    NREH:{body:path('M82 245L119 194H101L141 143H121L175 64L233 143H214L258 194H239L279 245Q286 277 252 278H109Q75 277 82 245',c),head:path('M168 108Q148 72 179 56Q206 77 187 107Z','#9bbd84'),prop:path('M268 213L293 205L318 213V252L293 245L268 252Z',cream)+line('M293 209v32','#b88954',3),eyes:'happy'},
    CAGM:{body:house,head:roof+rect(153,90,54,17,4,cream),prop:line('M289 196v59','#b88954',5)+circle(289,200,11,cream)+circle(289,221,11,'#de947b')+circle(289,241,11,gold),detail:path('M125 137L179 149L233 137L213 165L180 154L143 165Z',gold),eyes:'happy'},
    CAGH:{body:rect(103,112,156,166,53,c),head:path('M108 119Q90 66 161 67Q213 47 246 91L257 123Z',ink)+path('M202 109Q246 95 276 128H208Z',ink),prop:path('M268 211H317L312 257H273Z',gold)+line('M279 212v-8q14-21 27 0v8','#b88954',4),detail:line('M130 250h99',cream,7),eyes:'wink'},
    CAEM:{body:house,head:roof+rect(142,55,76,23,4,'#c28c56')+rect(164,32,31,28,5,gold),prop:path('M267 205L286 211L303 202L320 209V254L303 247L286 256L267 250Z',cream)+line('M286 215v35m17-43v35','#c69b65',3),detail:circle(180,254,11,gold)},
    CAEH:{body:rect(101,107,159,171,35,c),head:path('M105 112Q111 59 180 63Q239 60 256 112Z',c)+rect(103,104,155,20,6,cream)+path('M246 115l25 18-28 7Z',cream),prop:line('M280 246l22-51','#b88954',9)+path('M296 208L301 179Q324 182 310 210Z',ink),detail:path('M133 240L143 227H219L233 277H130Z','#d2b282')+rect(158,245,47,20,4,'#b68e5f')},
    CRGM:{body:round,head:path('M103 119Q104 71 166 75Q222 47 259 94L247 119Z','#c59c95')+circle(186,73,9,'#a97f79'),prop:rect(270,211,38,31,7,cream)+line('M309 215q22 0 0 21',cream,7)+line('M265 249h56',gold,5),detail:line('M130 249h102',cream,5),eyes:'happy'},
    CRGH:{body:rect(109,105,143,175,57,c),head:path('M118 121L131 66H226L244 121Z','#ba9771')+rect(91,114,179,15,7,'#a78360')+line('M128 103h103',cream,9),prop:rect(271,212,43,41,5,'#c39862')+line('M292 214v37M274 226h37',cream,5)+path('M292 212q-24-27-19-4l19 4q26-29 20-6Z',gold),detail:circle(151,254,7,cream)+circle(206,254,7,gold),eyes:'glasses'},
    CREM:{body:house,head:path('M77 119L113 88L180 63L249 88L283 119Z','#b38b6c')+path('M110 88L179 40L251 88Z','#d2ac83'),prop:path('M264 211Q279 202 293 212Q306 201 321 210V251Q308 241 293 251Q277 240 264 250Z',cream)+line('M293 214v33','#b88954',3),detail:line('M126 132l14 27m94-27-14 27',gold,8),eyes:'glasses'},
    CREH:{body:rect(99,115,164,164,62,c),head:path('M104 128Q98 70 162 76Q190 49 220 77Q261 78 258 128Z','#a28aab')+path('M174 78Q166 55 181 51Q194 61 187 78Z','#a28aab'),prop:rect(271,209,43,48,5,cream)+line('M279 224h24m-24 10h17','#b88954',3)+line('M303 240l14-39',gold,6),detail:path('M119 135Q180 155 244 135L230 159L208 160L220 185L199 188L187 159L136 157Z','#c5b4ce')},
  };
  return designs[code] ?? designs.NAGM!;
}
export function characterSvg(code:string,color='#38665c'){
  const d=designFor(code,color),nature=code[0]==='N';
  const eyes=d.eyes==='happy'?line('M152 188q7-9 14 0M194 188q7-9 14 0'):d.eyes==='wink'?circle(159,187,5,ink)+line('M194 187h12'):circle(159,187,5,ink)+circle(201,187,5,ink);
  const glasses=d.eyes==='glasses'?`<g fill="none" stroke="${ink}" stroke-width="3"><circle cx="159" cy="188" r="15"/><circle cx="201" cy="188" r="15"/><path d="M174 188h12"/></g>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="340" viewBox="0 0 360 340"><rect width="360" height="340" rx="140" fill="${nature?'#e1ebe4':'#f0e2d7'}"/>${circle(283,62,22,gold)}${path('M20 270Q90 222 170 263T350 254V340H20Z',color).replace('/>',' opacity=".13"/>')}${line('M140 270l-13 25M218 270l13 25',ink,14)}${line('M108 207Q64 179 66 215M251 205Q285 183 291 222',color,17)}${d.body}${d.head}${d.detail??''}<ellipse cx="180" cy="193" rx="58" ry="47" fill="${cream}"/>${eyes}${glasses}${line('M169 208q11 11 22 0')}${circle(144,205,8,'#e4ad94')}${circle(216,205,8,'#e4ad94')}${d.prop}</svg>`;
}
export function Character({code,color,className=''}:{code:string;color:string;className?:string}){
  const base=import.meta.env.BASE_URL;
  return <img className={`character ${className}`} src={`${base}images/types/${code.toLowerCase()}.png`} alt={`${code}の旅のキャラクター`} onError={e=>{const el=e.currentTarget;if(el.dataset.fallback)return;el.dataset.fallback='true';el.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(characterSvg(code,color));}}/>;
}
