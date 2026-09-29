import test from 'node:test';
import assert from 'node:assert/strict';
import {briefStream} from '../brief-stream.mjs';
import {readBriefResponse} from '../src/brief-response.mjs';
import {confirmedBaseline} from '../src/confirmed-baseline.mjs';
test('evidence arrives before inference, survives failure and releases the slot',async()=>{
 let finish, released=0;const gate=new Promise(resolve=>finish=resolve),seen=[];
 const response=briefStream(async emit=>{emit({type:'evidence',evidence:[{title:'Source'}]});await gate;throw Error('MODEL_TIMEOUT');},()=>released++);
 const result=readBriefResponse(response,e=>{seen.push(e);finish();});
 await assert.rejects(result,/MODEL_TIMEOUT/);assert.equal(seen[0].evidence[0].title,'Source');assert.equal(released,1);
});
test('stream handles fragmented UTF-8 and rejects incomplete conclusions',async()=>{
 const bytes=new TextEncoder().encode(JSON.stringify({type:'evidence',evidence:[{title:'中文'}]})+'\n'+JSON.stringify({type:'result',data:{mode:'ai'}})+'\n');
 const response=new Response(new ReadableStream({start(c){for(const byte of bytes)c.enqueue(Uint8Array.of(byte));c.close();}}),{headers:{'content-type':'application/x-ndjson'}});
 let seen;assert.equal((await readBriefResponse(response,e=>seen=e)).mode,'ai');assert.equal(seen.evidence[0].title,'中文');
 await assert.rejects(readBriefResponse(new Response('{"type":"stage"}\n',{headers:{'content-type':'application/x-ndjson'}})),/MODEL_STREAM_INTERRUPTED/);
});
test('cancellation does not release concurrency until the upstream job completes',async()=>{
 let finish,released=0;const gate=new Promise(r=>finish=r);
 const response=briefStream(async emit=>{await gate;emit({type:'evidence'});return {};},()=>released++);
 await response.body.cancel();assert.equal(released,0);finish();await new Promise(r=>setTimeout(r,0));assert.equal(released,1);
});
test('confirmation records the user baseline and preserves the unmodified extraction',()=>{
 const baseline={idea:'AI demand sustains growth',createdAt:'2026-09-20T00:00:00Z',assumptions:[{text:'Demand grows',invalidation:'Demand falls',monitor_terms:['GPU orders']}]};
 const brief={symbol:'NVDA',horizon:'30d',idea:baseline.idea,createdAt:baseline.createdAt,assumptions:baseline.assumptions,evidence:[],report:null};
 const draft=[{text:'Enterprise orders grow',invalidation:'Enterprise orders decline',monitor_terms:[]}];
 const entry=confirmedBaseline(brief,baseline,draft,Date.parse('2026-09-22T00:00:00Z'));
 draft[0].text='Mutated';baseline.assumptions[0].text='Mutated';
 assert.equal(entry.assumptions[0].text,'Enterprise orders grow');assert.equal(entry.baselineConfirmation.originalAssumptions[0].text,'Demand grows');assert.equal(entry.createdAt,'2026-09-22T00:00:00.000Z');
 assert.throws(()=>confirmedBaseline(brief,baseline,[{text:'Reason',invalidation:'  '}]),/INVALID_ASSUMPTIONS/);
});
