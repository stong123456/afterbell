// The competition-issued credential is scoped to Bitget's documented gateway.
// Keep the existing chat-completions contract for other allowlisted providers.
export async function modelFetch(url,options){
 if(url!=='https://hackathon.bitgetops.com/v1/chat/completions')return fetch(url,options);
 const request=JSON.parse(options.body);
 let response;try{response=await fetch('https://hackathon.bitgetops.com/v1/responses',{
  ...options,body:JSON.stringify({model:request.model,input:request.messages,max_output_tokens:request.max_tokens,store:false})
 });}catch(error){const auth=options.headers?.Authorization||'';console.error('QWEN_TRANSPORT',String(error.message).replaceAll(auth,'[redacted]').replaceAll(auth.replace(/^Bearer /,''),'[redacted]').slice(0,300));throw Error('MODEL_NETWORK_UNAVAILABLE');}
 if(!response.ok)return response;
 const data=await response.json();
 if(data.status!=='completed')throw Error('MODEL_RESPONSE_INCOMPLETE');
 const content=data.output_text||data.output?.filter(item=>item.type==='message').flatMap(item=>item.content||[]).filter(part=>part.type==='output_text').map(part=>part.text).join('');
 if(typeof content!=='string'||!content.trim())throw Error('MODEL_RESPONSE_EMPTY');
 return new Response(JSON.stringify({choices:[{message:{content}}]}),{status:200,headers:{'Content-Type':'application/json'}});
}
