export const providers={
 qwen:{label:'Qwen · Beijing',base:'https://dashscope.aliyuncs.com/compatible-mode/v1',model:'qwen-plus'},
 'qwen-intl':{label:'Qwen · Singapore',base:'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',model:'qwen-plus'},
 openai:{label:'OpenAI',base:'https://api.openai.com/v1',model:'gpt-4o-mini'},
 deepseek:{label:'DeepSeek',base:'https://api.deepseek.com',model:'deepseek-chat'}
};
export function userModelConfig(value){
 if(!value||!Object.hasOwn(providers,value.provider))throw Error('MODEL_PROVIDER_INVALID');
 if(typeof value.apiKey!=='string'||value.apiKey.length<8||value.apiKey.length>512||/\s/.test(value.apiKey))throw Error('MODEL_KEY_INVALID');
 if(typeof value.model!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/.test(value.model))throw Error('MODEL_NAME_INVALID');
 return {...providers[value.provider],provider:value.provider,model:value.model,apiKey:value.apiKey,configured:true};
}
