import React,{useState} from 'react';
export function AssumptionConfirm({assumptions,lang,onConfirm,onCancel}){
 const t=(zh,en)=>lang==='en'?en:zh;
 const [drafts,setDrafts]=useState(()=>assumptions.slice(0,4).map(a=>({...a,monitor_terms:[...(a.monitor_terms||[])]})));
 const update=(index,key,value)=>setDrafts(items=>items.map((a,i)=>i===index?{...a,[key]:value,...(key==='text'?{monitor_terms:[]}: {})}:a));
 return <form className="assumption-confirm" onSubmit={e=>{e.preventDefault();onConfirm(drafts);}}>
 <small>CONFIRM YOUR REASONS</small><h2>{t('这是你真正相信的理由吗？','Are these the reasons you believe it?')}</h2><p>{t('修改或删除不符合原意的假设。确认后会保留这一版，后续新证据与它对照。','Edit or remove assumptions that miss your meaning. This confirmed version becomes the baseline for future evidence.')}</p>
 {drafts.map((a,i)=><fieldset key={i}><legend>{t('假设 ','Assumption ')}{i+1}</legend><label>{t('我相信什么','What I believe')}<textarea required maxLength={500} value={a.text} onChange={e=>update(i,'text',e.target.value)}/></label><label>{t('出现什么证据时，这个理由不再成立？','What evidence would invalidate this reason?')}<textarea required maxLength={500} value={a.invalidation||''} onChange={e=>update(i,'invalidation',e.target.value)}/></label>{a.monitor_terms?.length>0&&<small>{t('关注词：','Watch terms: ')}{a.monitor_terms.join(' · ')}</small>}<button type="button" disabled={drafts.length===1} onClick={()=>setDrafts(d=>d.filter((_,j)=>j!==i))}>{t('删除这项','Remove')}</button></fieldset>)}
 <div className="brief-actions"><button type="button" disabled={drafts.length>=4} onClick={()=>setDrafts(d=>[...d,{text:'',invalidation:'',monitor_terms:[]}])}>{t('添加理由','Add a reason')}</button><button className="primary" type="submit">{t('确认并保存记忆','Confirm and remember')}</button><button type="button" onClick={onCancel}>{t('暂不保存','Cancel')}</button></div><p className="small">{t('保存在当前浏览器，最多 4 项。保存不代表假设已获证实。','Saved in this browser, up to 4 assumptions. Saving does not verify the assumptions.')}</p></form>;
}
