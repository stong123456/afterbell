import {stoneNews,stoneMarket} from '../stone-adapter.mjs';
import {researchContext,contextEvidence} from '../context.mjs';
import {challenge,scenarios} from '../src/research.mjs';
import {qwenChallenge} from '../qwen.mjs';
import {userModelConfig} from '../src/providers.mjs';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
let active=0;
async function database(env){
 if(!env.DB)throw Error('STORAGE_UNAVAILABLE');
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS afterbell_events (id TEXT PRIMARY KEY, payload TEXT NOT NULL, seen INTEGER NOT NULL)').run();
 return env.DB;
}
async function remember(env,events){
 const db=await database(env);
 if(events.length)await db.batch(events.map(e=>db.prepare('INSERT OR REPLACE INTO afterbell_events (id,payload,seen) VALUES (?,?,?)').bind(e.id,JSON.stringify(e),Date.now())));
 await db.prepare('DELETE FROM afterbell_events WHERE id NOT IN (SELECT id FROM afterbell_events ORDER BY seen DESC LIMIT 300)').run();
}
async function body(request){
 const reader=request.body?.getReader();if(!reader)throw Error('JSON_REQUIRED');let size=0;const chunks=[];
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>12000){await reader.cancel();throw Error('REQUEST_TOO_LARGE');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}return JSON.parse(new TextDecoder().decode(bytes));
}
export async function handle(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/api/health')return json({ok:true,product:'AfterBell',version:'0.3.0',ai:{provider:'byok',configured:false,model:'user-provided'}});
 if(url.pathname==='/api/news'&&request.method==='GET'){const news=await stoneNews();await remember(env,news.events||[]);return json(news);}
 if(url.pathname==='/api/market'&&request.method==='GET')return json(await stoneMarket());
 if(url.pathname==='/api/context'&&request.method==='GET')return json(await researchContext());
 if(url.pathname==='/api/challenge'&&request.method==='POST'){
  if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return json({error:'ORIGIN_NOT_ALLOWED'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON_REQUIRED'},415);
  const input=await body(request);
  if(typeof input.thesis!=='string'||input.thesis.trim().length<10||input.thesis.length>2000)return json({error:'THESIS_LENGTH'},400);
  if(!['rules','byok'].includes(input.mode||'rules'))return json({error:'USE_YOUR_OWN_MODEL_KEY'},400);
  if(input.mode==='byok')userModelConfig(input.modelConfig);
  let event=scenarios.find(e=>e.id===input.eventId);
  if(!event){const db=await database(env);const row=await db.prepare('SELECT payload FROM afterbell_events WHERE id=?').bind(input.eventId||'').first();if(row)event=JSON.parse(row.payload);}
  if(!event)return json({error:'EVENT_EXPIRED_REFRESH'},409);
  const evidence=[{id:'E1',kind:event.kind,title:event.title,summary:event.summary,url:event.source,publishedAt:event.publishedAt,scope:'headline-and-summary-only'}];
  const market=await stoneMarket();const quotes=market.assets?.filter(q=>event.assets.includes(q.symbol)&&q.price!==null)||[];
  if(quotes.length)evidence.push({id:'E2',kind:'market-snapshot',title:event.assets.join(' / ')+' rToken snapshot',summary:JSON.stringify(quotes.map(q=>({symbol:q.symbol,price:q.price,currency:q.quoteCurrency,snapshotAt:q.snapshotAt,tradeTimestamp:'unknown',stale:!Number.isFinite(Date.parse(q.snapshotAt))||Date.now()-Date.parse(q.snapshotAt)>300000}))),url:market.source,publishedAt:market.updatedAt,scope:'aggregated-quote-not-equity-close'});
  // Background is optional; this request does not delay an analysis for new CPI retrieval.
  const context=await caches.default.match(new Request(url.origin+'/__afterbell_context'));
  if(context)evidence.push(...contextEvidence(await context.json()));
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(evidence)));
  const evidenceHash=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
  if(input.mode==='byok'){
   if(active>=2)return json({error:'MODEL_BUSY'},429);active++;
   try{return json({...await qwenChallenge(input.thesis,event,evidence,input.lang==='en'?'en':'zh',input.modelConfig),evidenceHash});}finally{active--;}
  }
  return json({...challenge(input.thesis,event),evidence,eventId:event.id,evidenceHash});
 }
 if(url.pathname.startsWith('/api/'))return json({error:'NOT_FOUND'},404);
 const response=await env.ASSETS.fetch(request);
 if(response.status!==404||request.method!=='GET'||/\.[^/]+$/.test(url.pathname))return response;
 return env.ASSETS.fetch(new Request(new URL('/index.html',url),request));
}
export default {async fetch(request,env,ctx){
 try{
  const response=await handle(request,env);
  if(new URL(request.url).pathname==='/api/context'&&response.ok){const cached=new Response(response.clone().body,{headers:{'content-type':'application/json','cache-control':'public,max-age=60'}});ctx.waitUntil(caches.default.put(new Request(new URL('/__afterbell_context',request.url)),cached));}
  const secured=new Response(response.body,response);secured.headers.set('x-content-type-options','nosniff');secured.headers.set('referrer-policy','strict-origin-when-cross-origin');secured.headers.set('x-frame-options','DENY');return secured;
 }catch(e){return json({error:/^[A-Z_0-9]+$/.test(e.message)?e.message:'REQUEST_FAILED'},e.message==='REQUEST_TOO_LARGE'?413:/HTTP_|JSON_INVALID|EVIDENCE_INVALID/.test(e.message)?502:400);}
}};
