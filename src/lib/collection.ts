import type { Vector } from './diagnosis';
import attributes from '../content/attributes.json';
export type Attributes={age:number|null; prefecture:string|null; companion:number|null; experience:string|null};
export const emptyAttributes:Attributes={age:null,prefecture:null,companion:null,experience:null};
export { attributes };
export const appVersion='0.3.0';
let memorySession:string|undefined;
export function uuid(){ return crypto.randomUUID(); }
export function sessionId(){
  if(memorySession) return memorySession;
  try {
    const stored=localStorage.getItem('toyama-tabitype-session-v1');
    const id=stored&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(stored)?stored:uuid();
    localStorage.setItem('toyama-tabitype-session-v1',id); memorySession=id; return id;
  }catch { memorySession=uuid(); return memorySession; }
}
export interface EventPayload {
  event_id:string; result_id:string; event_type:'diagnosis'|'spot_click'; timestamp:string;
  session_id:string; app_version:string; consent:true; answers:Record<string,number>;
  axis_scores:Vector; type:string; attributes:Attributes; recommended_spot_ids:string[]; clicked_spot_id?:string;
}
export type Delivery='skipped'|'pending'|'requested'|'failed'|'stopped';
export async function sendEvent(payload:EventPayload,endpoint=import.meta.env.VITE_GAS_ENDPOINT||''):Promise<Delivery>{
  if(!endpoint || payload.consent!==true) return 'skipped';
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) return 'failed';
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),8000);
  try {
    // GAS redirects its response. Opaque response cannot prove sheet acceptance.
    await fetch(endpoint,{method:'POST',mode:'no-cors',credentials:'omit',redirect:'follow',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(payload),keepalive:true,signal:controller.signal});
    return 'requested';
  }catch { return 'failed'; }finally {clearTimeout(timer);}
}
