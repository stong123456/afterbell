import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchBlsCpi,fetchOkxMarkets} from '../askstone-sources.mjs';
import {contextEvidence} from '../context.mjs';
test('ported CPI adapter falls back to official FRED and excludes blank observations',async()=>{
  const rows=Array.from({length:14},(_,i)=>`${2025+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}-01,${100+i}`);
  const result=await fetchBlsCpi(async(url)=>{if(url.includes('bls.gov'))throw Error('offline');return{ok:true,text:async()=>`observation_date,CPIAUCSL\n${rows.join('\n')}\n2026-03-01,`};});
  assert.equal(result.indexValue,113);assert.equal(result.period,'M02');
});
test('ported quote adapter retains partial availability without making missing prices zero',async()=>{
  const result=await fetchOkxMarkets(async(url)=>{if(!url.includes('BTC-USDT'))throw Error('offline');return{ok:true,json:async()=>({code:'0',data:[{last:'',bidPx:'',askPx:'',open24h:'',ts:'1000'}]})};});
  assert.equal(result.items.length,1);assert.equal(result.items[0].last,null);
});
test('background evidence cannot present retrieval time as release time and expires',()=>{
  const context={retrievedAt:new Date().toISOString(),sources:[{id:'cpi',status:'ok',data:{sourceUrl:'https://fred.stlouisfed.org/series/CPIAUCSL'}}]};
  const evidence=contextEvidence(context);assert.equal(evidence[0].publishedAt,null);assert.match(evidence[0].scope,/not-event-confirmation/);
  assert.deepEqual(contextEvidence({...context,retrievedAt:'2000-01-01T00:00:00Z'}),[]);
});
