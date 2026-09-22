export const REVIEW_STATES=['challenged','unclear','no_meaningful_change'];
export function validateAssumptions(value){
 if(!Array.isArray(value)||value.length<2||value.length>4)throw Error('MODEL_ASSUMPTIONS_INVALID');
 const texts=new Set();return value.map(a=>{if(!a||typeof a.text!=='string'||!a.text.trim()||a.text.length>240||typeof a.invalidation!=='string'||!a.invalidation.trim()||a.invalidation.length>360||texts.has(a.text.trim().toLowerCase()))throw Error('MODEL_ASSUMPTIONS_INVALID');texts.add(a.text.trim().toLowerCase());return {text:a.text.trim(),invalidation:a.invalidation.trim()};});
}
export function reviewInput(input,now=Date.now()){
 if(!input||!/^[A-Z0-9.]{1,16}$/.test(input.symbol)||typeof input.idea!=='string'||input.idea.length<5||input.idea.length>2000||!Number.isFinite(Date.parse(input.createdAt))||Date.parse(input.createdAt)>now||!Array.isArray(input.assumptions)||!input.assumptions.length||input.assumptions.length>8)throw Error('REVIEW_INPUT_INVALID');
 const ids=new Set();const assumptions=input.assumptions.map(a=>{if(!a||typeof a.id!=='string'||a.id.length>80||ids.has(a.id)||typeof a.text!=='string'||!a.text.trim()||a.text.length>500||(a.invalidation!==undefined&&(typeof a.invalidation!=='string'||a.invalidation.length>500)))throw Error('REVIEW_INPUT_INVALID');ids.add(a.id);return {id:a.id,text:a.text,invalidation:a.invalidation||''};});
 return {symbol:input.symbol,idea:input.idea,createdAt:input.createdAt,assumptions,lang:input.lang==='en'?'en':'zh'};
}
export function reviewEvidence(input,events,now=Date.now()){
 const words=(input.idea+' '+input.assumptions.map(a=>a.text).join(' ')).toLowerCase().match(/[a-z]{4,}/g)||[];
 const score=e=>(e.assets?.includes(input.symbol)?10:0)+words.filter(w=>(e.title+' '+e.summary).toLowerCase().includes(w)).length+(['Policy','Macro'].includes(e.category)?1:0);
 return events.filter(e=>e.kind==='source'&&Date.parse(e.publishedAt)>Date.parse(input.createdAt)&&Date.parse(e.publishedAt)<=now&&score(e)>0).sort((a,b)=>score(b)-score(a)||Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,20).map((e,i)=>({id:'N'+(i+1),kind:'source',title:e.title,summary:e.summary,url:e.source,publishedAt:e.publishedAt,scope:'reported-headline-and-summary'}));
}
export function validateChanges(value,assumptions,evidence){
 if(!value||!Array.isArray(value.results)||value.results.length!==assumptions.length)throw Error('MODEL_REVIEW_INVALID');
 const ids=new Set(evidence.map(e=>e.id)),seen=new Set();return value.results.map(r=>{if(!r||!assumptions.some(a=>a.id===r.assumptionId)||seen.has(r.assumptionId)||!REVIEW_STATES.includes(r.status)||typeof r.reason!=='string'||!r.reason.trim()||r.reason.length>1400||!Array.isArray(r.evidenceIds)||r.evidenceIds.some(id=>!ids.has(id))||(r.status!=='unclear'&&!r.evidenceIds.length))throw Error('MODEL_REVIEW_INVALID');seen.add(r.assumptionId);return {assumptionId:r.assumptionId,status:r.status,reason:r.reason,evidenceIds:[...new Set(r.evidenceIds)]};});
}
export function validSavedReview(r,assumptions){try{return !!r&&Number.isFinite(Date.parse(r.checkedAt))&&Array.isArray(r.evidence)&&Array.isArray(r.assumptions)&&r.assumptions.length===assumptions.length&&r.assumptions.every(a=>assumptions.some(b=>a.id===b.id&&a.text===b.text&&(a.invalidation||'')===(b.invalidation||'')))&&validateChanges(r,r.assumptions,r.evidence).length===assumptions.length;}catch{return false;}}
