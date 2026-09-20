const HOUR=3600000;
export function eventWindows(market,publishedAt,now=Date.now()){
 const time=Date.parse(publishedAt);
 if(!Number.isFinite(time)||time>now)return null;
 const candles=(market?.candles||[]).filter(c=>Number.isFinite(c.time)&&c.time+HOUR<=now&&Number.isFinite(c.close)&&c.close>0).sort((a,b)=>a.time-b.time);
 const at=t=>{const c=candles.filter(c=>c.time+HOUR<=t).at(-1);return c&&t-(c.time+HOUR)<HOUR?c:null;};
 const base=at(time);if(!base)return null;
 const before=at(time-4*HOUR);
 const changes=Object.fromEntries([1,4,24].map(h=>{const c=time+h*HOUR<=now?at(time+h*HOUR):null;return [h,c?{pct:(c.close/base.close-1)*100,price:c.close,at:c.time+HOUR}:null];}));
 const sumVolume=(start,end)=>{const r=candles.filter(c=>c.time>=start&&c.time+HOUR<=end);return r.length===4&&new Set(r.map(c=>c.time)).size===4&&r.every(c=>Number.isFinite(c.volume)&&c.volume>=0)?r.reduce((s,c)=>s+c.volume,0):null;};
 const preVolume=sumVolume(base.time-3*HOUR,base.time+HOUR),postVolume=sumVolume(base.time+HOUR,base.time+5*HOUR);
 return {baseline:base.close,baselineAt:base.time+HOUR,before4h:before?(base.close/before.close-1)*100:null,changes,volumeRatio:preVolume>0&&postVolume!==null?postVolume/preVolume:null};
}
export function peerSet(symbol){const sets=[['NVDA','AMD','TSM'],['AAPL','MSFT','GOOGL'],['XOM','CVX','COP'],['TSLA','GM','F']];return sets.find(s=>s.includes(symbol))||[symbol||'NVDA'];}
export const CAPSULE_KEY='afterbell.capsules.v1';
export function validCapsule(c){return c?.version===1&&typeof c.id==='string'&&typeof c.thesis==='string'&&c.thesis.length<=2000&&Number.isFinite(Date.parse(c.savedAt))&&Number.isFinite(Date.parse(c.reviewAt))&&typeof c.event?.title==='string'&&Array.isArray(c.markets)&&c.markets.length<=4&&c.markets.every(m=>typeof m.symbol==='string'&&typeof m.source==='string'&&(m.price===null||Number.isFinite(m.price)));}
export function readCapsules(storage){try{const a=JSON.parse(storage.getItem(CAPSULE_KEY)||'[]');return Array.isArray(a)?a.filter(validCapsule).slice(0,30):[];}catch{return [];}}
export function freezeCapsule({event,markets,thesis,hours=24,report},now=Date.now()){
 if(typeof thesis!=='string'||thesis.trim().length<10||thesis.length>2000||![4,24,72,168].includes(hours))throw Error('INVALID_CAPSULE');
 return {version:1,id:crypto.randomUUID(),savedAt:new Date(now).toISOString(),reviewAt:new Date(now+hours*HOUR).toISOString(),thesis,analysis:report?.event===event.title?{mode:report.mode,model:report.model||null,createdAt:report.createdAt,verdict:report.verdict,checks:report.checks,evidence:report.evidence}:null,event:{id:event.id,title:event.title,summary:event.summary||'',source:event.source||null,publishedAt:event.publishedAt||null},markets:markets.slice(0,4).map(m=>({symbol:m.symbol,price:Number.isFinite(m.price)?m.price:null,quoteTimestamp:m.quoteTimestamp||null,source:m.source||'',browserFetched:!!m.browserFetched,windows:eventWindows(m,event.publishedAt,now)}))};
}
