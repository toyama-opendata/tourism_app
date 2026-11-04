import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { questions } from '../src/content/questions';
import { scoreAnswers, typeCode } from '../src/lib/diagnosis';
import { travelTypes } from '../src/content/types';
const context=vm.createContext({});vm.runInContext(readFileSync('gas/Code.gs','utf8'),context);
function payload(){const id=randomUUID(),a=Array(20).fill(3);return {event_id:id,result_id:id,event_type:'diagnosis',timestamp:new Date().toISOString(),session_id:randomUUID(),app_version:'0.3.0',consent:true,answers:Object.fromEntries(a.map((n,i)=>[`q${i+1}`,n])),axis_scores:scoreAnswers(a),type:typeCode(scoreAnswers(a)),attributes:{age:null as number|null,prefecture:null as string|null,companion:null as number|null,experience:null as string|null},recommended_spot_ids:['tym001','tym002','tym003','tym004','tym005','tym006'],clicked_spot_id:undefined as string|undefined};}
test('GAS validates all 16 frontend types and zero attribute codes',()=>{
  for(const t of travelTypes){const p=payload(),a=questions.map(q=>(t.code[q.axis]==='N'||t.code[q.axis]==='A'||t.code[q.axis]==='G'||t.code[q.axis]==='M'?1:-1)*q.direction>0?5:1);p.answers=Object.fromEntries(a.map((n,i)=>[`q${i+1}`,n]));p.axis_scores=scoreAnswers(a);p.type=typeCode(p.axis_scores);p.attributes.age=0;p.attributes.companion=0;assert.doesNotThrow(()=>context.validatePayload(p));}
});
test('GAS rejects lack of consent, tampering, invalid types and spreadsheet formulas',()=>{
  for(const mutate of [(p:ReturnType<typeof payload>)=>{p.consent=false;},(p:ReturnType<typeof payload>)=>{p.answers.q1=6;},(p:ReturnType<typeof payload>)=>{p.axis_scores[0]=.9;},(p:ReturnType<typeof payload>)=>{p.type='XXXX';},(p:ReturnType<typeof payload>)=>{p.attributes.prefecture='=IMPORTXML(...)';},(p:ReturnType<typeof payload>)=>{p.recommended_spot_ids[0]='tym999';}]){const p=payload();mutate(p);assert.throws(()=>context.validatePayload(p));}
});
test('click event must refer to one of the displayed spots',()=>{
  const p=payload();p.event_type='spot_click';p.event_id=randomUUID();p.clicked_spot_id='tym001';assert.doesNotThrow(()=>context.validatePayload(p));p.clicked_spot_id='tym007';assert.throws(()=>context.validatePayload(p));
});
test('GAS handler deduplicates event IDs under a lock and never stores invalid events',()=>{
  const rows:unknown[][]=[Array.from(context.HEADERS)];let held=false;
  const sheet={getLastRow:()=>rows.length,appendRow:(r:unknown[])=>rows.push(r),getRange:(start:number,col:number,count:number,width:number)=>({getValues:()=>rows.slice(start-1,start-1+count).map(r=>r.slice(col-1,col-1+width)),createTextFinder:(id:string)=>({matchEntireCell:()=>({findNext:()=>rows.some(r=>r[2]===id)?{}:null})})})};
  context.PropertiesService={getScriptProperties:()=>({getProperty:()=> 'fake-test-sheet'})};
  context.SpreadsheetApp={openById:()=>({getSheetByName:()=>sheet}),flush:()=>{}};
  context.LockService={getScriptLock:()=>({waitLock:()=>{held=true;},hasLock:()=>held,releaseLock:()=>{held=false;}})};
  context.ContentService={MimeType:{JSON:'json'},createTextOutput:(s:string)=>({setMimeType:()=>JSON.parse(s)})};
  const p=payload(),event={postData:{contents:JSON.stringify(p)}};
  assert.equal(context.doPost(event).ok,true);assert.equal(rows.length,2);assert.equal(held,false);
  assert.equal(context.doPost(event).duplicate,true);assert.equal(rows.length,2);
  p.consent=false;assert.equal(context.doPost({postData:{contents:JSON.stringify(p)}}).ok,false);assert.equal(rows.length,2);
});

test('new fifth questions affect their own axis and GAS stores all 20 answers',()=>{
  for(const index of [4,9,14,19]){
    const p=payload(),a=Array(20).fill(3);a[index]=5;
    p.answers=Object.fromEntries(a.map((n,i)=>['q'+(i+1),n]));
    p.axis_scores=scoreAnswers(a);p.type=typeCode(p.axis_scores);
    const expected=[0,0,0,0];expected[Math.floor(index/5)]=-.2;
    assert.deepEqual(p.axis_scores,expected);
    const row=context.validatePayload(p);
    assert.equal(row.length,context.HEADERS.length);
    assert.equal(row[8+index],5);
  }
  const p=payload();delete p.answers.q20;assert.throws(()=>context.validatePayload(p));
  const old=payload();old.app_version='0.2.0';assert.throws(()=>context.validatePayload(old));
});
