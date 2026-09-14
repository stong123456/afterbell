import test from 'node:test';
import assert from 'node:assert/strict';
import {userModelConfig} from '../src/providers.mjs';
import {qwenChallenge} from '../qwen.mjs';
import {scenarios} from '../src/research.mjs';
import {saveRecord} from '../src/journal.mjs';
test('user models reject arbitrary endpoints, unknown providers and header injection',()=>{
 assert.throws(()=>userModelConfig({provider:'http://localhost',apiKey:'example-key',model:'test'}));
 assert.throws(()=>userModelConfig({provider:'openai',apiKey:'example\nkey',model:'test'}));
 assert.equal(userModelConfig({provider:'openai',apiKey:'example-key',model:'test',base:'http://localhost'}).base,'https://api.openai.com/v1');
});
test('BYOK routes each key to its provider only and reports/journal contain no credential',async()=>{
 const original=globalThis.fetch;let saved='';
 try{for(const provider of ['qwen','qwen-intl','openai','deepseek']){
  const input={provider,apiKey:`test-only-${provider}`,model:'test-model'};
  globalThis.fetch=async(url,options)=>{
   assert.ok(url.startsWith(userModelConfig(input).base));assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,`Bearer ${input.apiKey}`);
   assert.ok(!options.body.includes(input.apiKey));const body=JSON.parse(options.body);assert.equal('enable_thinking' in body,provider.startsWith('qwen'));
   return{ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({verdict:'Needs evidence',checks:[{title:'A',body:'Unknown',type:'hypothesis',evidenceIds:[]},{title:'B',body:'Counterpoint',type:'counterpoint',evidenceIds:[]}],missing:['Full source']})}}]})};
  };
  const report=await qwenChallenge('A test thesis',scenarios[0],[],'en',input);
  assert.equal(report.mode,'byok');assert.equal(report.provider,provider);assert.ok(!JSON.stringify(report).includes(input.apiKey));
  saveRecord({getItem:()=>saved||'[]',setItem:(_,s)=>{saved=s;}},{version:1,id:provider,savedAt:new Date().toISOString(),event:scenarios[0],report});assert.ok(!saved.includes(input.apiKey));
 }}finally{globalThis.fetch=original;}
});
