import React,{useEffect,useState} from 'react';
import {translate} from './i18n.mjs';
export function ReasoningDesk({event,lang}) {
  const [context,setContext]=useState(null),[error,setError]=useState(false),[refresh,setRefresh]=useState(0);
  const t=(zh,en)=>lang==='en'?en:zh;
  useEffect(()=>{let alive=true;const controller=new AbortController();setError(false);fetch('/api/context',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(v=>{if(alive)setContext(v);}).catch(()=>{if(alive)setError(true);});return()=>{alive=false;controller.abort();};},[refresh]);
  if(!event.id)return null;
  return <section className="panel reasoning-desk">
    <div className="section-head"><div><div className="eyebrow">AFTERBELL / EVENTEDGE</div><h2>{t('拆解事件，检验传导','Trace the event. Test the transmission.')}</h2></div></div>
    <div className="reasoning-chain">{[
      [t('01 · 事件记录','01 · Event record'),event.kind==='source'?event.title:translate(event.title,lang),event.kind==='scenario'?t('演示情景 · 非已发生新闻','Illustrative scenario · Not reported news'):t('原文尚需人工核实','Original requires human verification')],
      [t('02 · 传导假设','02 · Transmission hypothesis'),translate(event.mechanism,lang),t('规则假设，不是已证实因果','Rule hypothesis, not established causality')],
      [t('03 · 受影响标的','03 · Exposed assets'),event.assets.join(' / ')||t('待确认','Unconfirmed'),t('需核实业务敞口与价格反应','Verify business exposure and price response')],
      [t('04 · 主动反证','04 · Counter-evidence'),translate(event.counter,lang),t('什么信息会推翻你的判断？','What would invalidate your thesis?')]
    ].map(([title,body,note],i)=><article key={title}><span>{title}</span><p data-original={i===0}>{body}</p><small>{note}</small></article>)}</div>
    <div className="section-head"><h3>{t('宏观与跨资产背景','Macro and cross-asset context')}</h3><button onClick={()=>setRefresh(n=>n+1)}>{t('刷新背景','Refresh context')}</button></div>
    <p>{t('沿用 AskStone 的公开数据适配器。以下信息仅作背景，不证明新闻导致价格变化；抓取时间不是事件发布时间。','Adapted from AskStone public-source adapters. Context does not establish that the event caused a price move; retrieval time is not publication time.')}</p>
    {error?<p role="status">{t('背景来源暂不可用，可继续研究原事件。','Context unavailable; event research remains available.')}</p>:!context?<p role="status">{t('正在检索官方 CPI 与跨资产报价…','Retrieving CPI and cross-asset observations…')}</p>:<>
    <small>{t('背景抓取时间：','Context retrieved: ')}{context.retrievedAt}</small>
    <div className="context-grid">{context.sources.map(s=><article key={s.id}><h3>{s.id==='cpi'?'CPI / BLS · FRED':'BTC · ETH · PAXG / OKX'}</h3>{s.status!=='ok'?<p>{t('来源不可用','Source unavailable')}</p>:s.id==='cpi'?<><p>{s.data.year} · {s.data.period} / {t('季调指数','Seasonally adjusted index')} {s.data.indexValue??'—'}</p><p>{t('季调环比','SA month-over-month')} {Number.isFinite(s.data.momPct)?s.data.momPct.toFixed(2)+'%':'—'}</p><a href={s.data.sourceUrl} target="_blank" rel="noreferrer">{t('查看官方序列','View official series')}</a></>:s.data.items.map(q=><p key={q.instId}>{q.instId} · {q.last??'—'} USDT · 24h {Number.isFinite(q.change24hPct)?q.change24hPct.toFixed(2)+'%':'—'}<br/><small>{Number.isFinite(q.observedAt)?new Date(q.observedAt).toISOString():t('报价时间未知','Quote time unknown')}</small></p>)}</article>)}</div></>}
    <p className="notice">{t('审核顺序：核实原文 → 检查传导假设 → 寻找反证 → 保存研究报告。报告证据指纹用于比对内容，不是链上回执或真实性证明。','Review: verify original → test transmission → seek counter-evidence → save report. The evidence fingerprint compares content; it is not an onchain receipt or proof of truth.')}</p>
  </section>;
}
