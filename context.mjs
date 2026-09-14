import {fetchBlsCpi,fetchOkxMarkets} from './askstone-sources.mjs';
let cached, pending;
export async function researchContext() {
  if(cached && Date.now()-Date.parse(cached.retrievedAt)<60000) return cached;
  if(pending) return pending;
  pending=(async()=>{
    const results=await Promise.allSettled([fetchBlsCpi(),fetchOkxMarkets()]);
    cached={retrievedAt:new Date().toISOString(),scope:'background-context-not-event-causality',sources:results.map((r,i)=>({id:i?'cross-asset':'cpi',status:r.status==='fulfilled'?'ok':'unavailable',data:r.status==='fulfilled'?r.value:null}))};
    return cached;
  })();
  try{return await pending;}finally{pending=null;}
}

export function contextEvidence(context) {
  // Macro and cross-asset observations are background, never proof of causality.
  if(!context || Date.now()-Date.parse(context.retrievedAt)>120000) return [];
  return context.sources.filter(s=>s.status==='ok').map((s,i)=>({
    id:`C${i+1}`,kind:'background-context',title:s.id==='cpi'?'Seasonally adjusted CPI index':'OKX cross-asset observations',
    summary:JSON.stringify(s.data),url:s.id==='cpi'?s.data.sourceUrl:'https://www.okx.com/markets/prices',
    publishedAt:null,retrievedAt:context.retrievedAt,scope:'background-only-not-event-confirmation; retrieval-time-is-not-release-time'
  }));
}
