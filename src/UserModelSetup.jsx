import React from 'react';
import {providers} from './providers.mjs';
export function UserModelSetup({lang,value,onChange,onUse,onClear}){
 const t=(zh,en)=>lang==='en'?en:zh;
 return <section className="panel detail model-setup"><h2>{t('使用你自己的 AI 模型','Use your own AI model')}</h2>
 <p>{t('API Key 仅保存在当前页面内存，刷新即清除。请求经 AfterBell 服务端转发至你选择的服务商；服务端不保存密钥。服务商按你的账号计费。','Your API key stays in page memory and clears on reload. Requests pass through the AfterBell server to your selected provider; the server does not persist the key. Provider usage is billed to your account.')}</p>
 <div className="fields"><label>{t('服务商 / 区域','Provider / region')}<select value={value.provider} onChange={e=>onChange({provider:e.target.value,model:providers[e.target.value].model,apiKey:''})}>{Object.entries(providers).map(([id,p])=><option key={id} value={id}>{p.label}</option>)}</select></label>
 <label>{t('模型名称','Model name')}<input value={value.model} maxLength={128} onChange={e=>onChange({...value,model:e.target.value})}/></label>
 <label>API Key<input type="password" autoComplete="off" spellCheck={false} value={value.apiKey} maxLength={512} onChange={e=>onChange({...value,apiKey:e.target.value})} placeholder={t('输入你的服务商密钥','Enter your provider key')}/></label></div>
 <p>{t('请求地址：','Endpoint: ')}{providers[value.provider].base}</p>
 <p>{t('提交分析时会发送你的观点、所选事件与可用背景证据。模型需支持 JSON 输出；默认名称可编辑，是否可用以你的账号权限为准。','Analysis sends your thesis, selected event and available background evidence. Models must support JSON output. Default names are editable; availability depends on your account.')}</p>
 <button disabled={value.apiKey.trim().length<8||!value.model.trim()} onClick={onUse}>{t('使用此配置','Use this configuration')}</button> <button onClick={onClear}>{t('清除密钥','Clear key')}</button>
 <p>{t('切换服务商会清除已有密钥，避免发往错误服务。配置完成不代表已验证，实际分析成功后才算调用通过。','Switching providers clears the key to avoid sending it to the wrong service. Configuration is not verification; a successful analysis confirms a working call.')}</p></section>;
}
