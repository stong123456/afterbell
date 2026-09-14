import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
test('public worker ignores legacy platform keys and enforces BYOK and same origin',async()=>{
 const env={OPENAI_API_KEY:'legacy-not-real',DASHSCOPE_API_KEY:'legacy-not-real'};
 const health=await worker.fetch(new Request('https://askstone.xyz/api/health'),env,{});
 assert.equal((await health.json()).ai.configured,false);
 const payload={thesis:'A sufficiently long thesis',mode:'qwen',eventId:'chips'};
 const request=(body,origin='https://askstone.xyz')=>new Request('https://askstone.xyz/api/challenge',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(body)});
 assert.equal((await worker.fetch(request(payload,'https://untrusted.example'),env,{})).status,403);
 assert.equal((await (await worker.fetch(request(payload),env,{})).json()).error,'USE_YOUR_OWN_MODEL_KEY');
 assert.equal((await worker.fetch(request({...payload,mode:'byok',modelConfig:{provider:'localhost'}}),env,{})).status,400);
 assert.equal((await worker.fetch(request({...payload,thesis:'x'.repeat(13000)}),env,{})).status,413);
});
test('static navigation fallback preserves missing asset status',async()=>{
 const env={ASSETS:{fetch:async req=>new Response(new URL(req.url).pathname==='/index.html'?'AfterBell':'Missing',{status:new URL(req.url).pathname==='/index.html'?200:404})}};
 assert.equal(await (await worker.fetch(new Request('https://askstone.xyz/research'),env,{})).text(),'AfterBell');
 assert.equal((await worker.fetch(new Request('https://askstone.xyz/missing.js'),env,{})).status,404);
});
