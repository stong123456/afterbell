import {stoneMarket,stoneNews} from './stone-adapter.mjs';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {challenge,scenarios} from './src/research.mjs';
import {modelConfig,qwenChallenge} from './qwen.mjs';
import {deploymentConfig,requestAllowed} from './deployment.mjs';
import {researchContext,contextEvidence} from './context.mjs';
import {createHash} from 'node:crypto';
try{process.loadEnvFile('.env');}catch(e){if(e.code!=='ENOENT')throw e;}
const root=resolve('dist'),deployment=deploymentConfig(),port=deployment.port;
const archivedEvents=new Map();let activeModels=0;let latestMarket=null;let latestContext=null;
function remember(events){for(const e of events)archivedEvents.set(e.id,e);while(archivedEvents.size>300)archivedEvents.delete(archivedEvents.keys().next().value);}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
http.createServer(async(req,res)=>{
 try{
  if(!deployment.hosts.has(req.headers.host))return send(res,403,{error:'HOST_NOT_ALLOWED'});
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/health')return send(res,200,{ok:true,version:'0.2.0',ai:modelConfig()});
  if(url.pathname==='/api/context'){latestContext=await researchContext();return send(res,200,latestContext);}
  if(url.pathname==='/api/market'){latestMarket=await stoneMarket();return send(res,200,latestMarket);}
  if(url.pathname==='/api/news'){const news=await stoneNews();remember(news.events);return send(res,200,news);}
  if(url.pathname==='/api/challenge'&&req.method==='POST'){
   if(!requestAllowed(req.headers,deployment))return send(res,403,{error:'ORIGIN_NOT_ALLOWED'});
   if(!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{error:'JSON_REQUIRED'});
   let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>12000)return send(res,413,{error:'REQUEST_TOO_LARGE'});chunks.push(chunk);}
   const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(typeof input.thesis!=='string'||input.thesis.trim().length<10||input.thesis.length>2000)return send(res,400,{error:'THESIS_LENGTH'});
   if(!['rules','qwen','byok'].includes(input.mode||'rules'))return send(res,400,{error:'UNKNOWN_MODE'});
   const event=scenarios.find(e=>e.id===input.eventId)||archivedEvents.get(input.eventId);
   if(!event)return send(res,409,{error:'EVENT_EXPIRED_REFRESH'});
   const evidence=[{id:'E1',kind:event.kind,title:event.title,summary:event.summary,url:event.source,publishedAt:event.publishedAt,scope:'headline-and-summary-only'}];
   const quotes=latestMarket?.assets?.filter(q=>event.assets.includes(q.symbol)&&q.price!==null)||[];
   if(quotes.length)evidence.push({id:'E2',kind:'market-snapshot',title:event.assets.join(' / ')+' rToken snapshot',summary:JSON.stringify(quotes.map(q=>({symbol:q.symbol,price:q.price,currency:q.quoteCurrency,snapshotAt:q.snapshotAt,tradeTimestamp:'unknown',stale:!Number.isFinite(Date.parse(q.snapshotAt))||Date.now()-Date.parse(q.snapshotAt)>300000}))),url:latestMarket.source,publishedAt:latestMarket.updatedAt,scope:'aggregated-quote-not-equity-close'});
   if(input.mode==='qwen'||input.mode==='byok'){
    if(activeModels>=2)return send(res,429,{error:'MODEL_BUSY'});
    if(input.mode==='qwen'&&!modelConfig().configured)return send(res,503,{error:'QWEN_NOT_CONFIGURED'});
    if(input.mode==='byok'&&!input.modelConfig)return send(res,400,{error:'MODEL_KEY_REQUIRED'});
    evidence.push(...contextEvidence(latestContext));
    activeModels++;try{const report=await qwenChallenge(input.thesis,event,evidence,input.lang==='en'?'en':'zh',input.mode==='byok'?input.modelConfig:undefined);return send(res,200,{...report,evidenceHash:createHash('sha256').update(JSON.stringify(evidence)).digest('hex')});}finally{activeModels--;}
   }
   evidence.push(...contextEvidence(latestContext));
   return send(res,200,{...challenge(input.thesis,event),evidence,eventId:event.id,evidenceHash:createHash('sha256').update(JSON.stringify(evidence)).digest('hex')});
  }
  if(url.pathname.startsWith('/api/'))return send(res,404,{error:'NOT_FOUND'});
  let file=resolve(root,'.'+decodeURIComponent(url.pathname));
  if(file!==root&&!file.startsWith(root+sep))return send(res,403,{error:'FORBIDDEN'});
  if(!extname(file))file=resolve(root,'index.html');
  try{const data=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(data);}catch{send(res,404,{error:'NOT_FOUND'});}
 }catch(e){send(res,/^QWEN_|^MODEL_/.test(e.message)?502:400,{error:/^[A-Z_0-9]+$/.test(e.message)?e.message:'REQUEST_FAILED'});}
}).listen(port,deployment.bind,()=>console.log(`AfterBell listening on ${deployment.bind}:${port}`));
