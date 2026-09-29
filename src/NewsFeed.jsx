import React,{useState} from 'react';
import {sourceCopy} from './source-copy.mjs';
export function SourceExcerpt({item,lang}) {
 const t=(zh,en)=>lang==='en'?en:zh;
 const {title,summary}=sourceCopy(item),url=item.url||item.source;
 const valid=/^https?:\/\//.test(url||'');
 let name=item.sourceName;try{name=name||new URL(url).hostname;}catch{}
 const at=Date.parse(item.publishedAt);
 return <div className="source-excerpt">
  <div className="source-meta"><span>{name||t('来源记录','Source record')}</span>{Number.isFinite(at)&&<time dateTime={item.publishedAt}>{new Date(at).toLocaleString(lang==='en'?'en-US':'zh-CN')}</time>}</div>
  <h3>{item.id?.startsWith('N')?'['+item.id+'] ':''}{title}</h3>
  {summary?<><p>{summary.length>220?summary.slice(0,220)+'…':summary}</p>{summary.length>220&&<details><summary>{t('展开完整来源摘要','Read full source excerpt')}</summary><p>{summary}</p></details>}</>:<p>{t('该来源仅提供标题，正文请打开原文阅读。','This source provides a headline only. Open the original for details.')}</p>}
  {valid&&<a href={url} target="_blank" rel="noreferrer">{t('阅读原文','Read original')} ↗</a>}
 </div>;
}
export function NewsFeed({events=[],lang,busy,onAnalyze,onEvidence}){
 const [limit,setLimit]=useState(9);const t=(zh,en)=>lang==='en'?en:zh;
 const seen=new Set();const news=events.filter(e=>{const key=e.source||e.id;if(e.kind!=='source'||seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
 return <section className="news-feed"><div className="section-head"><div><small>THE EVIDENCE FEED</small><h2>{t('读消息，再形成判断','Read the news. Then form a view.')}</h2><p>{news.length} {t('条来源记录 · 摘要由来源提供，未经独立核实','source records · Source-provided excerpts, not independently verified')}</p></div><button onClick={onEvidence}>{t('全部证据','All evidence')} →</button></div>
 <div className="news-grid">{news.slice(0,limit).map(e=><article key={e.id||e.source}><SourceExcerpt item={e} lang={lang}/><footer><span>{e.assets?.slice(0,4).join(' · ')||e.category}</span>{e.assets?.length>0&&<button disabled={busy} onClick={()=>onAnalyze(e.assets[0])}>{t('审视 ','Review ')}{e.assets[0]} ↗</button>}</footer></article>)}</div>
 {!news.length&&<p>{t('暂时没有可用消息，稍后刷新来源。','No source records available. Refresh later.')}</p>}
 {news.length>limit&&<button className="news-more" onClick={()=>setLimit(n=>n+9)}>{t('再看 9 条消息','Show 9 more stories')} ↓</button>}
 </section>;
}
