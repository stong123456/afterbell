import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewInput,reviewEvidence,validateAssumptions,validSavedReview} from '../src/change-review.mjs';
import {createThesis,readTheses} from '../src/thesis-memory.mjs';
import {checkWhatChanged} from '../stone-brief.mjs';

test('baseline and incremental window are separate and invalid windows fail closed',()=>{
 const raw={symbol:'AAPL',idea:'Services growth remains resilient',baselineAt:'2026-09-20T00:00:00Z',reviewSince:'2026-09-21T00:00:00Z',assumptions:[{id:'0',text:'App Store revenue grows',monitor_terms:['App Store commissions','应用商店佣金']}]};
 const now=Date.parse('2026-09-23T00:00:00Z'),input=reviewInput(raw,now);
 const event={kind:'source',title:'应用商店佣金新数据',source:'https://example.com/report',assets:[]};
 const result=reviewEvidence(input,[{...event,publishedAt:'2026-09-20T12:00:00Z'},{...event,publishedAt:raw.reviewSince},{...event,publishedAt:'2026-09-22T00:00:00Z'}],now);
 assert.equal(result.length,1);assert.equal(input.baselineAt,raw.baselineAt);assert.equal(input.reviewSince,raw.reviewSince);
 for(const reviewSince of ['bad','2026-09-19T00:00:00Z','2026-09-24T00:00:00Z'])assert.throws(()=>reviewInput({...raw,reviewSince},now),/WINDOW_INVALID/);
 const legacy=reviewInput({...raw,baselineAt:undefined,reviewSince:undefined,createdAt:raw.baselineAt},now);assert.equal(legacy.reviewSince,raw.baselineAt);
});

test('monitoring profiles persist, validate and invalidate obsolete saved reviews',()=>{
 const assumptions=validateAssumptions([{text:'Service revenue grows',invalidation:'Revenue contracts',monitor_terms:['App Store','应用商店']},{text:'Margins hold',invalidation:'Margins fall',monitor_terms:['gross margin']}]);
 const thesis=createThesis({symbol:'AAPL',idea:'Services support growth',horizon:'30d',assumptions});
 assert.deepEqual(thesis.assumptions[0].monitor_terms,['App Store','应用商店']);assert.equal(readTheses({getItem:()=>JSON.stringify([thesis])}).length,1);
 assert.throws(()=>validateAssumptions([{...assumptions[0],monitor_terms:['x']},assumptions[1]]),/MONITOR_TERMS_INVALID/);
 const review={checkedAt:new Date().toISOString(),assumptions:thesis.assumptions,evidence:[],results:thesis.assumptions.map(a=>({assumptionId:a.id,status:'unclear',reason:'No evidence',evidenceIds:[]}))};
 assert.equal(validSavedReview(review,thesis.assumptions),true);assert.equal(validSavedReview(review,thesis.assumptions.map(a=>({...a,monitor_terms:['changed profile']}))),false);
});

test('two-stage review sends only news after reviewSince to both model passes',async()=>{
 const original=globalThis.fetch,now=Date.now(),iso=delta=>new Date(now+delta).toISOString();
 const input={symbol:'NVDA',idea:'AI demand remains strong',baselineAt:iso(-3*86400000),reviewSince:iso(-86400000),assumptions:[{id:'0',text:'Nvidia AI demand grows',monitor_terms:['GPU orders']}],modelConfig:{provider:'qwen',model:'qwen-plus',apiKey:'test-key-only'}};
 const calls=[];
 try{globalThis.fetch=async(url,options)=>{
  if(String(url).endsWith('/chat/completions')){const request=JSON.parse(options.body),payload=JSON.parse(request.messages[1].content);calls.push(payload);assert.equal(payload.evidence.length,1);assert.ok(payload.evidence[0].title.includes('NEW'));return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(calls.length===1?{matches:[{assumptionId:'0',evidenceIds:['N1']}]}:{results:[{assumptionId:'0',status:'challenged',reason:'New GPU order evidence weakens demand',evidenceIds:['N1']}]})}}]})};}
  if(String(url).includes('/api/editorial'))return {ok:true,json:async()=>({items:[{id:'old',title:'Nvidia OLD GPU orders',url:'https://example.com/old',publishedAt:iso(-2*86400000)},{id:'new',title:'Nvidia NEW GPU orders',url:'https://example.com/new',publishedAt:iso(-3600000)}]})};
  return {ok:true,text:async()=>'<rss><channel/></rss>'};
 };const result=await checkWhatChanged(input);assert.equal(calls.length,2);assert.equal(result.baselineAt,input.baselineAt);assert.equal(result.reviewSince,input.reviewSince);assert.equal(result.results[0].status,'challenged');
 }finally{globalThis.fetch=original;}
});
