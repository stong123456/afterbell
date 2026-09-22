export const REVIEW_STATES=['challenged','unclear','no_meaningful_change'];
export function monitorTerms(value){
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>8||value.some(t=>typeof t!=='string'||t.trim().length<2||t.length>80))throw Error('MONITOR_TERMS_INVALID');
 return [...new Set(value.map(t=>t.trim()))];
}
export function validateAssumptions(value,requireProfile=false){
 if(!Array.isArray(value)||value.length<2||value.length>4)throw Error('MODEL_ASSUMPTIONS_INVALID');
 const texts=new Set();return value.map(a=>{if(!a||typeof a.text!=='string'||!a.text.trim()||a.text.length>240||typeof a.invalidation!=='string'||!a.invalidation.trim()||a.invalidation.length>360||texts.has(a.text.trim().toLowerCase()))throw Error('MODEL_ASSUMPTIONS_INVALID');if(requireProfile&&monitorTerms(a.monitor_terms).length<2)throw Error('MODEL_MONITOR_TERMS_INVALID');texts.add(a.text.trim().toLowerCase());return {text:a.text.trim(),invalidation:a.invalidation.trim(),monitor_terms:monitorTerms(a.monitor_terms)};});
}
export function reviewInput(input,now=Date.now()){
 const baselineAt=input?.baselineAt??input?.createdAt,reviewSince=input?.reviewSince??baselineAt;
 if(!Number.isFinite(Date.parse(baselineAt))||!Number.isFinite(Date.parse(reviewSince))||Date.parse(baselineAt)>Date.parse(reviewSince)||Date.parse(reviewSince)>now)throw Error('REVIEW_WINDOW_INVALID');
 if(!input||!/^[A-Z0-9.]{1,16}$/.test(input.symbol)||typeof input.idea!=='string'||input.idea.length<5||input.idea.length>2000||!Array.isArray(input.assumptions)||!input.assumptions.length||input.assumptions.length>8)throw Error('REVIEW_INPUT_INVALID');
 const ids=new Set();const assumptions=input.assumptions.map(a=>{if(!a||typeof a.id!=='string'||a.id.length>80||ids.has(a.id)||typeof a.text!=='string'||!a.text.trim()||a.text.length>500||(a.invalidation!==undefined&&(typeof a.invalidation!=='string'||a.invalidation.length>500)))throw Error('REVIEW_INPUT_INVALID');ids.add(a.id);return {id:a.id,text:a.text,invalidation:a.invalidation||'',...(a.monitor_terms!==undefined?{monitor_terms:monitorTerms(a.monitor_terms)}:{})};});
 return {symbol:input.symbol,idea:input.idea,createdAt:baselineAt,baselineAt,reviewSince,assumptions,lang:input.lang==='en'?'en':'zh'};
}
const TOPICS=[
 ['capex','资本开支','资本支出','云厂商','云服务','hyperscaler','cloud spending'],
 ['出口限制','出口管制','芯片禁令','export control','export restriction','china chips'],
 ['blackwell','gpu','半导体','芯片','semiconductor','datacenter','data center','数据中心','tsmc','台积电'],
 ['robotaxi','fsd','自动驾驶','无人驾驶','autonomous driving'],
 ['ev','电动车','电池','battery','electric vehicle'],
 ['利率','美联储','降息','加息','federal reserve','interest rate','fomc'],
 ['台湾','供应链','taiwan','supply chain'],
 ['关税','tariff']
];
const EXPOSURES={NVDA:[0,1,2,6],AMD:[0,1,2,6],TSM:[0,1,2,6],TSLA:[3,4,7],MSFT:[0,2],GOOGL:[0,2],META:[0,2],AMZN:[0,2]};
const ALIASES={NVDA:['nvidia','英伟达'],TSLA:['tesla','特斯拉'],AMD:['amd','超微'],TSM:['tsmc','台积电'],MSFT:['microsoft','微软'],GOOGL:['google','谷歌'],META:['meta'],AMZN:['amazon','亚马逊']};
const contains=(text,term)=>/^[a-z]{2,4}$/.test(term)?new RegExp('\\b'+term+'\\b','i').test(text):text.includes(term);
export function reviewEvidence(input,events,now=Date.now(),limit=20){
 const watch=input.assumptions.flatMap(a=>monitorTerms(a.monitor_terms)).map(t=>t.toLowerCase());
 const thesis=(input.idea+' '+input.assumptions.map(a=>a.text+' '+(a.invalidation||'')).join(' ')).toLowerCase();
 const topics=TOPICS.map((terms,i)=>terms.some(w=>contains(thesis,w))?i:-1).filter(i=>i>=0);
 const tokens=[...new Set(thesis.match(/[a-z]{4,}/g)||[])].filter(w=>!['this','that','with','will','have','remain','remains','strong','growth','demand','would','could','should'].includes(w));
 const chinese=[...new Set((thesis.match(/[\u4e00-\u9fff]{2,}/g)||[]).flatMap(s=>Array.from({length:Math.max(0,s.length-2)},(_,i)=>s.slice(i,i+3))))];
 const score=e=>{const text=(e.title+' '+(e.summary||'')).toLowerCase();const direct=e.assets?.includes(input.symbol)||[input.symbol.toLowerCase(),...(ALIASES[input.symbol]||[])].some(w=>contains(text,w));const matched=TOPICS.map((terms,i)=>terms.some(w=>contains(text,w))?i:-1).filter(i=>i>=0);return (direct?10:0)+watch.filter(w=>contains(text,w)).length*6+matched.filter(i=>topics.includes(i)).length*4+(watch.length?0:matched.filter(i=>(EXPOSURES[input.symbol]||[]).includes(i)).length*2)+tokens.filter(w=>contains(text,w)).length+chinese.filter(w=>text.includes(w)).length;};
 return events.filter(e=>e.kind==='source'&&Date.parse(e.publishedAt)>Date.parse(input.reviewSince??input.baselineAt??input.createdAt)&&Date.parse(e.publishedAt)<=now&&score(e)>=2).sort((a,b)=>score(b)-score(a)||Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,limit).map((e,i)=>({id:'N'+(i+1),kind:'source',title:e.title,summary:e.summary,url:e.source,publishedAt:e.publishedAt,scope:'reported-headline-and-summary'}));
}
export function newLeads(thesis,events,now=Date.now()){
 const review=validSavedReview(thesis.changeReview,thesis.assumptions)?thesis.changeReview:null;
 const since=review?.checkedAt||thesis.createdAt;
 return reviewEvidence({...thesis,baselineAt:thesis.createdAt,reviewSince:since},events,now,240);
}
export function validateSelection(value,assumptions,evidence){
 if(!Array.isArray(value?.matches)||value.matches.length!==assumptions.length)throw Error('MODEL_SELECTION_INVALID');
 const seen=new Set(),selected=new Set();for(const m of value.matches){if(!assumptions.some(a=>a.id===m.assumptionId)||seen.has(m.assumptionId)||!Array.isArray(m.evidenceIds)||m.evidenceIds.length>2||m.evidenceIds.some(id=>!evidence.some(e=>e.id===id)))throw Error('MODEL_SELECTION_INVALID');seen.add(m.assumptionId);m.evidenceIds.forEach(id=>selected.add(id));}
 return evidence.filter(e=>selected.has(e.id)).slice(0,8);
}
export function validateChanges(value,assumptions,evidence){
 if(!value||!Array.isArray(value.results)||value.results.length!==assumptions.length)throw Error('MODEL_REVIEW_INVALID');
 const ids=new Set(evidence.map(e=>e.id)),seen=new Set();return value.results.map(r=>{if(!r||!assumptions.some(a=>a.id===r.assumptionId)||seen.has(r.assumptionId)||!REVIEW_STATES.includes(r.status)||typeof r.reason!=='string'||!r.reason.trim()||r.reason.length>1400||!Array.isArray(r.evidenceIds)||r.evidenceIds.some(id=>!ids.has(id))||(r.status!=='unclear'&&!r.evidenceIds.length))throw Error('MODEL_REVIEW_INVALID');seen.add(r.assumptionId);return {assumptionId:r.assumptionId,status:r.status,reason:r.reason,evidenceIds:[...new Set(r.evidenceIds)]};});
}
export function validSavedReview(r,assumptions){try{return !!r&&Number.isFinite(Date.parse(r.checkedAt))&&Array.isArray(r.evidence)&&Array.isArray(r.assumptions)&&r.assumptions.length===assumptions.length&&r.assumptions.every(a=>assumptions.some(b=>a.id===b.id&&a.text===b.text&&(a.invalidation||'')===(b.invalidation||'')&&JSON.stringify(a.monitor_terms||[])===JSON.stringify(b.monitor_terms||[])))&&validateChanges(r,r.assumptions,r.evidence).length===assumptions.length;}catch{return false;}}
