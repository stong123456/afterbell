export const THESIS_KEY='askstone.theses.v1';
export const STATES=['unverified','supported','at-risk','broken'];
export function splitAssumptions(text){return text.split(/[\n；;。]+/).map(s=>s.trim()).filter(Boolean).slice(0,8).map((text,i)=>({id:String(i),text:text.slice(0,500),status:'unverified'}));}
export function createThesis({symbol,horizon,idea,assumptions},now=Date.now()){
 if(!/^[A-Z0-9.]{1,16}$/.test(symbol)||idea.trim().length<5||idea.length>2000||!assumptions.length||assumptions.length>8||assumptions.some(a=>!a.text.trim()))throw Error('INVALID_THESIS');
 return {version:1,id:crypto.randomUUID(),symbol,horizon:horizon.slice(0,100),idea,createdAt:new Date(now).toISOString(),assumptions:assumptions.map((a,i)=>({id:String(i),text:a.text.slice(0,500),invalidation:typeof a.invalidation==='string'?a.invalidation.slice(0,500):'',status:'unverified'})),history:[],seen:[],closed:false};
}
export function readTheses(storage){try{const a=JSON.parse(storage.getItem(THESIS_KEY)||'[]');return Array.isArray(a)?a.filter(x=>x?.version===1&&typeof x.id==='string'&&/^[A-Z0-9.]{1,16}$/.test(x.symbol)&&typeof x.idea==='string'&&x.idea.length<=2000&&Number.isFinite(Date.parse(x.createdAt))&&Array.isArray(x.assumptions)&&x.assumptions.length>0&&x.assumptions.length<=8&&x.assumptions.every(a=>typeof a.id==='string'&&typeof a.text==='string'&&STATES.includes(a.status))&&typeof x.horizon==='string'&&Array.isArray(x.history)&&x.history.length<=100&&x.history.every(h=>h&&typeof h.id==='string'&&typeof h.assumption==='string'&&typeof h.note==='string'&&STATES.includes(h.from)&&STATES.includes(h.to)&&Number.isFinite(Date.parse(h.at))&&typeof h.evidence?.title==='string'&&/^https?:\/\//.test(h.evidence?.source||''))&&Array.isArray(x.seen)&&x.seen.every(id=>typeof id==='string')).slice(0,50):[];}catch{return [];}}
export function health(thesis){const a=thesis.assumptions;return {total:a.length,reviewed:a.filter(x=>x.status!=='unverified').length,supported:a.filter(x=>x.status==='supported').length,atRisk:a.filter(x=>x.status==='at-risk').length,broken:a.filter(x=>x.status==='broken').length};}
export function candidates(thesis,events,now=Date.now()){return events.filter(e=>e.kind==='source'&&e.assets?.includes(thesis.symbol)&&Date.parse(e.publishedAt)>Date.parse(thesis.createdAt)&&Date.parse(e.publishedAt)<=now&&!thesis.seen.includes(e.id)).filter((e,i,a)=>a.findIndex(x=>x.id===e.id)===i).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));}
export function recordReview(thesis,{assumptionId,status,note,event},now=Date.now()){
 const a=thesis.assumptions.find(a=>a.id===assumptionId);
 if(!a||!STATES.includes(status)||!note?.trim()||note.length>1000||!event?.id||!/^https?:\/\//.test(event.source||''))throw Error('EVIDENCE_REQUIRED');
 return {...thesis,assumptions:thesis.assumptions.map(x=>x.id===a.id?{...x,status}:x),history:[{id:crypto.randomUUID(),at:new Date(now).toISOString(),assumption:a.text,from:a.status,to:status,note:note.trim(),evidence:{id:event.id,title:event.title,source:event.source,publishedAt:event.publishedAt},actor:'user-confirmed'},...thesis.history].slice(0,100)};
}
export function marketDifference(base,current){
 if(!base||!current||base.symbol!==current.symbol||base.peer!==current.peer)return null;
 const valid=s=>[s.asset,s.benchmark].every(q=>Number.isFinite(q?.price)&&q.price>0&&Number.isFinite(q?.time)&&Math.abs(s.at-q.time)<=120000)&&Math.abs(s.asset.time-s.benchmark.time)<=120000;
 if(!valid(base)||!valid(current)||current.at<=base.at||current.asset.time<=base.asset.time||current.benchmark.time<=base.benchmark.time)return null;
 const asset=(current.asset.price/base.asset.price-1)*100,benchmark=(current.benchmark.price/base.benchmark.price-1)*100;
 return {asset,benchmark,difference:asset-benchmark};
}
