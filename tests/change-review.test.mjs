import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAssumptions,reviewInput,reviewEvidence,validateChanges,validSavedReview,newLeads,validateSelection} from '../src/change-review.mjs';
import {reviewShare} from '../src/review-share.mjs';
import {createThesis,readTheses} from '../src/thesis-memory.mjs';
import {qwenChallenge} from '../qwen.mjs';
const a=[{id:'a',text:'Cloud capex remains strong',invalidation:'Cloud providers cut capex'},{id:'b',text:'Demand grows',invalidation:'Orders decline'}];
const evidence=[{id:'N1',title:'Capex outlook',url:'https://example.com/a',publishedAt:'2026-09-22T00:00:00Z'}];
test('bilingual retrieval excludes unrelated policy and includes Chinese thesis dependencies',()=>{
 const input={symbol:'NVDA',idea:'云厂商资本开支不会下降',assumptions:a,createdAt:'2026-09-20T00:00:00Z'};
 const e={kind:'source',publishedAt:'2026-09-22T00:00:00Z',assets:[],category:'Policy',source:'https://example.com'};
 const rows=reviewEvidence(input,[{...e,title:'SEC approves unrelated banking paperwork'},{...e,title:'微软下调资本开支计划'},{...e,title:'Export controls expand to AI chips'}],Date.parse('2026-09-23T00:00:00Z'));
 assert.equal(rows.length,2);assert.ok(rows.some(r=>r.title.includes('微软')));
 assert.throws(()=>validateSelection({matches:[{assumptionId:'a',evidenceIds:['FAKE']},{assumptionId:'b',evidenceIds:[]}]},a,rows));
 assert.equal(validateSelection({matches:[{assumptionId:'a',evidenceIds:[rows[0].id]},{assumptionId:'b',evidenceIds:[]}]},a,rows).length,1);
});
test('unreviewed leads older than 24 hours survive until the next check',()=>{
 const thesis={symbol:'NVDA',idea:'Cloud capex remains strong',createdAt:'2026-09-19T00:00:00Z',assumptions:a};
 const events=[{kind:'source',title:'Nvidia capex',assets:['NVDA'],publishedAt:'2026-09-21T00:00:00Z'}];
 const now=Date.parse('2026-09-23T00:00:00Z');assert.equal(newLeads(thesis,events,now).length,1);
 thesis.changeReview={checkedAt:'2026-09-22T00:00:00Z',assumptions:a,evidence:[],results:a.map(a=>({assumptionId:a.id,status:'unclear',reason:'No evidence',evidenceIds:[]}))};
 assert.equal(newLeads(thesis,events,now).length,0);
 const svg=reviewShare(thesis,{...thesis.changeReview,results:[{status:'unclear',reason:'<script>bad</script>'}]});assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('1 unclear'));
});
test('assumptions are distinct falsifiable fields, not evidence checks',()=>{assert.equal(validateAssumptions(a).length,2);assert.throws(()=>validateAssumptions([{text:'A claim'}]));assert.throws(()=>validateAssumptions([a[0],a[0]]));const entry=createThesis({symbol:'NVDA',horizon:'30d',idea:'AI demand grows',assumptions:a});assert.equal(entry.assumptions[0].invalidation,a[0].invalidation);assert.equal(entry.assumptions[0].status,'unverified');assert.equal(readTheses({getItem:()=>JSON.stringify([entry])}).length,1);});
test('review includes only post-baseline nonfuture evidence and allows related policy evidence',()=>{const input=reviewInput({symbol:'NVDA',idea:'Cloud capex remains strong',createdAt:'2026-09-21T00:00:00Z',assumptions:a},Date.parse('2026-09-23T00:00:00Z'));const e={id:'1',title:'Policy news',summary:'Export restrictions',assets:[],kind:'source',category:'Policy',source:'https://example.com/a',publishedAt:'2026-09-22T00:00:00Z'};assert.equal(reviewEvidence(input,[e,{...e,publishedAt:'2026-09-20T00:00:00Z'},{...e,publishedAt:'2026-09-24T00:00:00Z'}],Date.parse('2026-09-23T00:00:00Z')).length,1);assert.throws(()=>reviewInput({...input,assumptions:[a[0],a[0]]}));});
test('every assumption gets one result, supported changes require existing citations',()=>{const value={results:[{assumptionId:'a',status:'challenged',reason:'Reported capex cut',evidenceIds:['N1']},{assumptionId:'b',status:'unclear',reason:'No direct evidence',evidenceIds:[]}]};assert.equal(validateChanges(value,a,evidence).length,2);for(const mutate of [v=>v.results.pop(),v=>v.results[0].evidenceIds=[],v=>v.results[0].evidenceIds=['FAKE'],v=>v.results[1].assumptionId='a',v=>v.results[1].status='no_meaningful_change']){const v=structuredClone(value);mutate(v);assert.throws(()=>validateChanges(v,a,evidence));}assert.equal(validSavedReview({...value,checkedAt:new Date().toISOString(),assumptions:a,evidence},a),true);assert.equal(validSavedReview({...value,checkedAt:new Date().toISOString(),assumptions:a,evidence},[{...a[0],text:'A different belief'},a[1]]),false);});
test('brief extraction validates the dedicated model field and does not copy hypothesis checks',async()=>{const original=globalThis.fetch;const output={verdict:'Needs review',checks:[{title:'For',body:'Conditional support distinct from assumption',type:'hypothesis',evidenceIds:[]},{title:'Against',body:'A counterpoint',type:'counterpoint',evidenceIds:[]}],missing:[],assumptions:a.map(x=>({...x,monitor_terms:['cloud capex','云厂商资本开支']}))};try{globalThis.fetch=async(u,o)=>{const b=JSON.parse(o.body);assert.ok(b.messages[0].content.includes('separate assumptions array'));return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(output)}}]})};};const r=await qwenChallenge('AI demand grows',{kind:'source',title:'NVDA'},[],'en',{provider:'qwen',model:'qwen-plus',apiKey:'test-key-only'},{extractAssumptions:true});assert.equal(r.assumptions[0].text,a[0].text);delete output.assumptions;await assert.rejects(()=>qwenChallenge('AI demand grows',{kind:'source',title:'NVDA'},[],'en',{provider:'qwen',model:'qwen-plus',apiKey:'test-key-only'},{extractAssumptions:true}),/ASSUMPTIONS_INVALID/);}finally{globalThis.fetch=original;}});
