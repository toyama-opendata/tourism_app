import { questions, axes } from '../content/questions';
export type Vector = [number,number,number,number];
export interface Spot { id:string; name:string; municipality:string; scores:Vector; n:number; reason:string|null; description:string; url:string; }
export function scoreAnswers(answers: readonly number[]): Vector {
  if(answers.length!==16 || answers.some(x=>!Number.isInteger(x)||x<1||x>5)) throw new Error('16問すべてに回答してください');
  const sums:Vector=[0,0,0,0];
  questions.forEach((q,i)=>{sums[q.axis]+=((answers[i]-3)/2)*q.direction/4;});
  return sums;
}
// 中立(0)は左に分類。画面では同点・中立であることを別途明示する。
export const typeCode=(scores:Vector)=>scores.map((n,i)=>n>=0?axes[i].left:axes[i].right).join('');
export const typeVector=(code:string):Vector=>axes.map((a,i)=>code[i]===a.left?1:-1) as Vector;
export const recommendationSettings={weights:[1,1,1,1] as Vector,municipalityPenalty:0.35};
export function recommend(scores:Vector,spots:Spot[],count=3,excluded:string[]=[]):Spot[]{
  const selected:Spot[]=[];
  const candidates=spots.filter(s=>!excluded.includes(s.id));
  while(selected.length<count && candidates.length){
    const similarity=(s:Spot)=>s.scores.reduce((sum,x,i)=>sum+scores[i]*(x/2)*recommendationSettings.weights[i],0)-selected.filter(x=>x.municipality===s.municipality).length*recommendationSettings.municipalityPenalty;
    candidates.sort((a,b)=>similarity(b)-similarity(a)||a.id.localeCompare(b.id));
    selected.push(candidates.shift()!);
  }
  return selected;
}
export function recommendations(scores:Vector,spots:Spot[]){
  const primary=recommend(scores,spots);
  // 同じ16タイプの代表ベクトルを使用。最初の3件と重複させない。
  const extra=recommend(typeVector(typeCode(scores)),spots,3,primary.map(s=>s.id));
  return {primary,extra};
}
