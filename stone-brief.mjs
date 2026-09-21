import {stoneNews} from './stone-adapter.mjs';
import {inferAssets} from './evidence-feeds.mjs';
import {bitgetMarket} from './bitget.mjs';
import {qwenChallenge} from './qwen.mjs';
import {userModelConfig} from './src/providers.mjs';
export function demoConfig(env={}){return {configured:typeof env.ASKSTONE_DEMO_QWEN_KEY==='string'&&env.ASKSTONE_DEMO_QWEN_KEY.length>=8,provider:env.ASKSTONE_DEMO_QWEN_REGION==='intl'?'qwen-intl':'qwen',model:env.ASKSTONE_DEMO_QWEN_MODEL||'qwen-plus'};}
export function parseBriefInput(input){
 if(typeof input.idea!=='string'||input.idea.trim().length<5||input.idea.length>2000)throw Error('IDEA_LENGTH');
 const inferred=inferAssets(input.idea),symbol=String(input.symbol||inferred[0]||'').toUpperCase();
 if(!/^[A-Z0-9.]{1,16}$/.test(symbol))throw Error('TICKER_REQUIRED');
 return {idea:input.idea.trim(),symbol,lang:input.lang==='en'?'en':'zh',action:input.action==='challenge'?'challenge':'brief'};
}
export async function reserveDemo(db,ip,now=Date.now()){
 if(!db||!ip)throw Error('DEMO_LIMIT_UNAVAILABLE');
 const day=new Date(now).toISOString().slice(0,10),bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(day+':'+ip));
 const hash=[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
 await db.prepare('CREATE TABLE IF NOT EXISTS askstone_demo_usage (bucket TEXT PRIMARY KEY, used INTEGER NOT NULL, expires INTEGER NOT NULL)').run();
 await db.prepare('DELETE FROM askstone_demo_usage WHERE expires < ?').bind(now).run();
 for(const [bucket,limit] of [[day+':ip:'+hash,5],[day+':global',100]]){
 const row=await db.prepare('INSERT INTO askstone_demo_usage(bucket,used,expires) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET used=used+1 WHERE used < ? RETURNING used').bind(bucket,now+2*86400000,limit).first();
 if(!row)throw Error('DEMO_DAILY_LIMIT');
 }
}
export async function stoneBrief(input,env={},permit=async()=>{}){
 const {idea,symbol,lang,action}=parseBriefInput(input),demo=demoConfig(env);
 const own=input.modelConfig?userModelConfig(input.modelConfig):null;
 if(action==='challenge'&&!own&&!demo.configured)throw Error('AI_NOT_CONFIGURED');
 // Reserve attempts before any expensive upstream work. Dedicated demo key only.
 if(!own&&demo.configured)await permit();
 const [news,market]=await Promise.all([stoneNews(),bitgetMarket(symbol)]);
 const relevant=news.events.filter(e=>e.assets?.includes(symbol)).slice(0,8);
 const evidence=relevant.map((e,i)=>({id:'N'+(i+1),kind:'source',title:e.title,summary:e.summary,url:e.source,publishedAt:e.publishedAt,scope:'reported-headline-and-summary-not-independently-verified'}));
 const fresh=market.price>0&&Number.isFinite(market.quoteTimestamp)&&Math.abs(Date.now()-market.quoteTimestamp)<120000;
 if(fresh)evidence.push({id:'M1',kind:'market-snapshot',title:symbol+' Bitget token quote',summary:JSON.stringify({price:market.price,change24hPct:market.change24hPct,quoteTimestamp:market.quoteTimestamp,warning:'rolling 24h change, not event impact or sector-adjusted return'}),url:market.source,publishedAt:new Date(market.quoteTimestamp).toISOString(),scope:'token-quote-not-underlying-equity'});
 let report=null;
 if(own||demo.configured){const config=own?input.modelConfig:{...demo,apiKey:env.ASKSTONE_DEMO_QWEN_KEY};report=await qwenChallenge((action==='challenge'?'Act as a skeptical counterparty. Challenge, do not flatter. ':'Give a concise balanced brief. ')+idea,{kind:'source',title:symbol+' · combined evidence'},evidence,lang,config);}
 const assumptions=report?.checks.filter(c=>c.type==='hypothesis').slice(0,3).map(c=>c.body.slice(0,500))||[];
 return {symbol,idea,horizon:lang==='en'?'Next 30 days (default)':'未来 30 天（默认）',createdAt:new Date().toISOString(),mode:report?'ai':'evidence-only',action,report,assumptions:assumptions.length?assumptions:[idea],evidence,sourceCount:relevant.length,market:fresh?{price:market.price,change24hPct:market.change24hPct,at:market.quoteTimestamp,url:market.source}:null};
}
