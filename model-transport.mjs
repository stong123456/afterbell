// The competition-issued credential is scoped to Bitget's documented gateway.
// Keep the existing chat-completions contract for other allowlisted providers.
export async function modelFetch(url,options){
 // Workers supports manual redirects; never forward credentials to a redirect target.
 options={...options,redirect:'manual'};
 if(url!=='https://hackathon.bitgetops.com/v1/chat/completions')return fetch(url,options);
 const request=JSON.parse(options.body);
 let response;try{response=await fetch('https://hackathon.bitgetops.com/v1/responses',{
  ...options,body:JSON.stringify({model:request.model,input:request.messages,reasoning:{effort:'low'},max_output_tokens:request.max_tokens<=700?1536:4096,store:false})
 });}catch(error){const auth=options.headers?.Authorization||'';console.error('QWEN_TRANSPORT',String(error.message).replaceAll(auth,'[redacted]').replaceAll(auth.replace(/^Bearer /,''),'[redacted]').slice(0,300));throw Error(options.signal?.aborted?'MODEL_TIMEOUT':'MODEL_NETWORK_UNAVAILABLE');}
 if(!response.ok)return response;
 const data=await response.json();
 if(data.status!=='completed')throw Error('MODEL_RESPONSE_INCOMPLETE');
 let content=data.output_text||data.output?.filter(item=>item.type==='message').flatMap(item=>item.content||[]).filter(part=>part.type==='output_text').map(part=>part.text).join('');
 if(typeof content==='string'&&request.response_format?.type==='json_object'){const fenced=content.trim().match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);if(fenced)content=fenced[1].trim();}
 if(typeof content!=='string'||!content.trim())throw Error('MODEL_RESPONSE_EMPTY');
 return new Response(JSON.stringify({choices:[{message:{content}}]}),{status:200,headers:{'Content-Type':'application/json'}});
}
