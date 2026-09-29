export function sourceCopy(item){
 const raw=String(item.title||'').trim();
 const flash=raw.match(/^【([^】]+)】\s*([\s\S]+)$/);
 let title=flash?flash[1]:raw,summary=String(item.summary||'').trim();
 if(/^(原始来源记录；|Original source headline\.)/.test(summary))summary='';
 if(flash)summary=flash[2].length>summary.replace(/^【[^】]+】\s*/,'').length?flash[2]:summary.replace(/^【[^】]+】\s*/,'');
 if(summary===raw||/^(原始来源记录；|Original source headline\.)/.test(summary))summary='';
 return {title,summary};
}
