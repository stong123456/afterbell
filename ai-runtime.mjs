let lastAI=null;
export function noteAISuccess(provider,model){lastAI={provider,model,at:new Date().toISOString()};}
export function aiRuntimeState(config){return {...config,status:!config.configured?'not_configured':lastAI?'ready':'configured_unverified',lastSuccess:lastAI};}
