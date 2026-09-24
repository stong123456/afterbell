import test from 'node:test';
import assert from 'node:assert/strict';
import {modelFetch} from '../model-transport.mjs';
import {demoConfig} from '../stone-brief.mjs';
test('competition credentials use only the documented Responses gateway',async()=>{
 const original=globalThis.fetch;let incomplete=false;
 try{globalThis.fetch=async(url,options)=>{assert.equal(url,'https://hackathon.bitgetops.com/v1/responses');const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.model,'qwen3.8-max');assert.equal(body.input[0].content,'Test');assert.equal(body.response_format,undefined);return new Response(JSON.stringify({status:incomplete?'incomplete':'completed',output:[{type:'message',content:[{type:'output_text',text:'{"ok":true}'}]}]}));};
 const args=['https://hackathon.bitgetops.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer test-key'},body:JSON.stringify({model:'qwen3.8-max',messages:[{role:'user',content:'Test'}],max_tokens:256})}];
 const r=await modelFetch(...args);assert.equal(JSON.parse((await r.json()).choices[0].message.content).ok,true);incomplete=true;await assert.rejects(()=>modelFetch(...args),/INCOMPLETE/);
 assert.equal(demoConfig({ASKSTONE_DEMO_QWEN_PROVIDER:'bitget-qwen'}).provider,'bitget-qwen');
 }finally{globalThis.fetch=original;}
});
