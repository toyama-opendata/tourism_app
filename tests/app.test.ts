import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { axes, questions } from '../src/content/questions';
import { travelTypes } from '../src/content/types';
import { recommendations, recommend, scoreAnswers, typeCode, typeVector, type Spot } from '../src/lib/diagnosis';
import { sendEvent } from '../src/lib/collection';
const data=JSON.parse(readFileSync('public/data/spots.json','utf8'));
test('16 types are reachable, with consistent reverse-scored questions',()=>{
  assert.equal(new Set(travelTypes.map(t=>t.code)).size,16);
  for(const t of travelTypes){
    const desired=typeVector(t.code);
    const a=questions.map(q=>desired[q.axis]*q.direction>0?5:1);
    assert.deepEqual(scoreAnswers(a),desired);assert.equal(typeCode(scoreAnswers(a)),t.code);
    const {primary,extra}=recommendations(desired,data.spots);
    assert.equal(new Set([...primary,...extra].map(s=>s.id)).size,6);
  }
  axes.forEach((_,i)=>{const q=questions.filter(q=>q.axis===i);assert.equal(q.length,5);assert.ok(q.some(q=>q.direction===-1));});
});
test('neutral scores and incomplete answers are handled explicitly',()=>{
  assert.deepEqual(scoreAnswers(Array(20).fill(3)),[0,0,0,0]);
  assert.equal(typeCode([0,0,0,0]),'NAGM');
  assert.throws(()=>scoreAnswers([1,2]));assert.throws(()=>scoreAnswers(Array(20).fill(0)));
});
test('municipality penalty diversifies near-equal choices',()=>{
  const s=(id:string,city:string,n:number):Spot=>({id,name:id,municipality:city,scores:[n,0,0,0],n:100,reason:null,description:'',url:'https://example.com'});
  const chosen=recommend([1,0,0,0],[s('a','富山市',2),s('b','富山市',1.9),s('c','高岡市',1.8)],2);
  assert.deepEqual(chosen.map(s=>s.id),['a','c']);
});
test('published data has only aggregates and valid bounded scores',()=>{
  assert.equal(data.spots.length,47);
  for(const s of data.spots){
    assert.deepEqual(Object.keys(s).sort(),['id','name','municipality','scores','n','reason','description','url'].sort());
    assert.ok(s.scores.every((x:number)=>Number.isFinite(x)&&Math.abs(x)<=2));
    if(s.n<10)assert.equal(s.reason,null);
    assert.ok(s.url.startsWith('https://'));
  }
  assert.ok(data.spots.find((s:Spot)=>s.name==='称名滝').scores[3]>0);
});
test('no endpoint or no consent causes no network request',async()=>{
  const original=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;return new Response();};
  try{
    assert.equal(await sendEvent({consent:true} as never,''),'skipped');
    assert.equal(await sendEvent({consent:false} as never,'https://script.google.com/macros/s/test/exec'),'skipped');
    assert.equal(calls,0);
  }finally{globalThis.fetch=original;}
});
test('GAS delivery uses a simple request and does not claim confirmed storage',async()=>{
  const original=globalThis.fetch;let options:RequestInit|undefined;
  globalThis.fetch=async(_,o)=>{options=o;return new Response();};
  try{
    assert.equal(await sendEvent({consent:true} as never,'https://script.google.com/macros/s/test/exec'),'requested');
    assert.equal(options?.mode,'no-cors');assert.equal(options?.credentials,'omit');
    assert.equal((options?.headers as Record<string,string>)['Content-Type'],'text/plain;charset=UTF-8');
  }finally{globalThis.fetch=original;}
});
