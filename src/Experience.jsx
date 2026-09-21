import {ThesisDesk} from './ThesisDesk.jsx';
import {StockLogo} from './StockLogo.jsx';
import {EventDetective,Capsules} from './EventDetective.jsx';
import {MarketExplorer} from './MarketExplorer.jsx';
import {DecisionPlan} from './DecisionPlan.jsx';
import {eventLens} from './decision.mjs';
import React,{useState,useEffect,useRef} from 'react';
import './experience.css';
import {localizeTree} from './i18n.mjs';

const shortTitle=e=>e.title?.match(/^【([^】]+)】/)?.[1]||e.title;
const styles=['briefing','studio','workspace'];
export function Experience({newsInfo,lang,setLang,page,navigate,events,event,setEvent,loading,refresh,challenge,marketPanel,reasoning,settings,journal,records,setThesis,report,setComparisonPeers}){
 const t=(zh,en)=>lang==='en'?en:zh;
 const [style,setStyle]=useState(()=>{try{const v=localStorage.getItem('afterbell.style');return styles.includes(v)?v:'workspace';}catch{return 'workspace';}});
 const [catalog,setCatalog]=useState([]);
 const [sourceFilter,setSourceFilter]=useState('All');
 const [limit,setLimit]=useState(12);
 const [asset,setAsset]=useState('All'),[query,setQuery]=useState(''),[started,setStarted]=useState(false),[checking,setChecking]=useState(false);
 const checkRef=useRef(null);
 useEffect(()=>{try{localStorage.setItem('afterbell.style',style);}catch{}},[style]);
 useEffect(()=>{if(report)setChecking(true);},[report]);
 useEffect(()=>{if(checking)checkRef.current?.scrollIntoView({behavior:'smooth',block:'start'});},[checking]);
 const filtered=events.filter(e=>(sourceFilter==='All'||e.sourceName===sourceFilter)&&(asset==='All'||e.assets?.includes(asset))&&(!query||`${e.title} ${e.summary}`.toLowerCase().includes(query.toLowerCase())));
 const chosen=event.id?event:filtered[0];
 const lens=chosen?eventLens(chosen,lang):null;
 function focusAsset(s){setAsset(s);setEvent({id:'',title:'',assets:[],checks:[]});setChecking(false);setStarted(true);navigate('Radar');}
 function choose(e){setEvent(e);setChecking(false);setStarted(true);navigate('Event');}
 function begin(){if(chosen){setEvent(chosen);setStarted(true);navigate('Event');}}
 function inspect(intent){if(!chosen)return;setEvent(chosen);setThesis(t(`我正在考虑${intent} ${chosen.assets?.join(' / ')||'相关币股'}，请结合这条事件检查支持证据、反方证据和需要核实的风险。`,`I am considering ${intent} ${chosen.assets?.join(' / ')||'related tokens'}. Check supporting evidence, counterarguments and missing information for this event.`));setChecking(true);setStarted(true);navigate('Event');}
 const assetPicker=<div className="asset-picker" aria-label={t('关注的资产','Followed assets')}>{['All','NVDA','TSLA','AAPL','AMD'].map(s=>
<button key={s} aria-pressed={asset===s} onClick={()=>{setAsset(s);setEvent({id:'',title:'',assets:[],checks:[]});setChecking(false);}}>{s!=='All'&&<StockLogo symbol={s}/>}<span>{s==='All'?t('全部','All'):s}</span></button>)}<select aria-label={t('全部币股','All stock tokens')} value={asset} onChange={e=>focusAsset(e.target.value)}><option value="All">{t('全部币股','All stock tokens')}</option>{Array.from(new Set(['NVDA','TSLA','AAPL','AMD',...events.flatMap(e=>e.assets||[]),...catalog.map(a=>a.symbol)])).sort().map(s=><option key={s} value={s}>{s}</option>)}</select></div>;
 const list=<section className="event-list">
<div className="list-heading">
<h2>{t('值得关注的事件','Events to explore')}</h2>
<span>{filtered.length}</span>
</div>
<input aria-label={t('搜索事件','Search events')} placeholder={t('搜索事件或关键词','Search events or keywords')} value={query} onChange={e=>{setQuery(e.target.value);setEvent({id:'',title:'',assets:[],checks:[]});setLimit(12);}}/>{filtered.slice(0,limit).map(e=>
<button className="story-link" key={e.id} aria-pressed={chosen?.id===e.id} onClick={()=>choose(e)}>
<small>{e.assets?.join(' · ')||t('宏观事件','Macro')}</small>
<strong>{shortTitle(e)}</strong>
<span>{e.sourceName||t('原始来源','Source')} · {e.publishedAt?new Date(e.publishedAt).toLocaleDateString(lang==='zh'?'zh-CN':'en-US'):t('时间待核实','Time unverified')}</span>
</button>)}{filtered.length>limit&&<button onClick={()=>setLimit(n=>n+12)}>{t('显示更多','Show more')}</button>}{!filtered.length&&<div className="empty">
<h3>{loading?t('正在整理事件','Loading events'):t('暂无匹配事件','No matching events')}</h3>
<p>{t('可以换一只资产，或稍后刷新来源。','Try another asset or refresh the sources.')}</p>
<button onClick={refresh}>{t('刷新来源','Refresh sources')}</button>
</div>}</section>;
 const story=chosen&&<article className="story-card">
<div className="story-kicker">{chosen.assets?.join(' / ')||t('全球事件','Global event')} <span>{t('来源记录 · 影响待核实','Source record · Impact unverified')}</span>
</div>
<h2 data-original>{shortTitle(chosen)}</h2>
<section>
<h3>{t('发生了什么','What happened')}</h3>
<p data-original>{chosen.summary||chosen.title}</p>
</section>
<section>
<h3>{t('可能怎样传导','How it may matter')}</h3>
<p>{(chosen.kind==='source'?lens.path:chosen.mechanism)||t('资产关联来自关键词映射。需要核实事件范围和业务影响，尚不能确认价格变化由该事件引起。','Asset relevance is keyword-based. Verify scope and business impact before attributing a price move to this event.')}</p>
<small>{t('传导假设，非已确认结论','Hypothesis, not an established conclusion')}</small>
</section>
<section>
<h3>{t('还不能确定什么','What remains uncertain')}</h3>
<p>{(chosen.kind==='source'?lens.counter:chosen.counter)||t('市场是否已经反映消息、消息的实际影响，以及后续是否出现相反证据。','Whether the market has priced this in, its actual impact, and whether contrary evidence emerges.')}</p>
</section>
<details>
<summary>{t('查看完整来源与核实清单','Full source and verification checklist')}</summary>
<p data-original>{chosen.title}</p>{chosen.checks?.map(c=>
<p key={c}>{c}</p>)}{chosen.source&&/^https?:\/\//.test(chosen.source)&&<a href={chosen.source} target="_blank" rel="noreferrer">{t('阅读原始来源','Read original source')}</a>}</details>
</article>;
 return <div className={`experience theme-${style}`}>
<header className="experience-header">
<button className="wordmark" onClick={()=>{navigate('Radar');setStarted(true);}}>AskStone<span>THESIS OS</span>
</button>
<nav aria-label={t('主导航','Main navigation')}><button aria-current={['Radar','Event'].includes(page)?'page':undefined} onClick={()=>navigate('Radar')}>{t('首页 · 证据','Home · Evidence')}</button><button aria-current={page==='Thesis'?'page':undefined} onClick={()=>navigate('Thesis')}>{t('我的逻辑','My theses')}</button><button aria-current={page==='Market'?'page':undefined} onClick={()=>navigate('Market')}>{t('币股市场','Markets')}</button>

<button aria-current={page==='Journal'?'page':undefined} onClick={()=>navigate('Journal')}>{t('我的研究','My research')} <small>{records.length}</small>
</button>
</nav>
<div className="preferences">
<label>{t('风格','Style')}<select aria-label={t('界面风格','Interface style')} value={style} onChange={e=>setStyle(e.target.value)}>
<option value="briefing">{t('01 简报','01 Briefing')}</option>
<option value="studio">{t('02 引导','02 Studio')}</option>
<option value="workspace">{t('03 工作台','03 Workspace')}</option>
</select>
</label>
<button onClick={()=>setLang(lang==='zh'?'en':'zh')}>{lang==='zh'?'EN':'中文'}</button>
<button onClick={()=>navigate('Sources')}>{t('设置','Settings')}</button>
</div>
</header>
<main className="experience-main">{page==='Thesis'?<ThesisDesk lang={lang} events={events} loading={loading} refresh={refresh} onLibrary={()=>navigate('Journal')} onChallenge={(saved,e)=>{setEvent(e);setThesis((saved.idea+'\n'+saved.assumptions.map(a=>a.text+' ['+a.status+']').join('\n')+'\n'+t('请站在反方，逐条核对支持、反对证据与缺失信息。','Challenge each assumption with supporting, opposing and missing evidence.')).slice(0,2000));setChecking(true);setStarted(true);navigate('Event');}}/>:page==='Capsules'?<Capsules lang={lang}/>:page==='Market'?<MarketExplorer lang={lang} onCatalog={setCatalog} onFocus={focusAsset}/>:page==='Sources'?<>
<h1>{t('模型与数据设置','Models & data')}</h1>{settings}</>:page==='Journal'?<>
<h1>{t('让每次判断，都可以回顾。','Make every decision reviewable.')}</h1><button onClick={()=>navigate('Capsules')}>{t('查看时间胶囊','Open time capsules')}</button>{journal}</>:<>
<div className="experience-title">
<small>ASKSTONE · EVIDENCE FIRST</small>
<h1>{t('先看证据，再检查你的判断。','Start with evidence. Revisit your thesis.')}</h1>
<p>{t('选择币股，了解事件与价格反应，再检查你的交易想法。','Choose an asset, explore events and price reactions, then challenge your thesis.')}</p>
</div><div className="evidence-toolbar"><label>{t('新闻来源','News source')}<select value={sourceFilter} onChange={e=>{setSourceFilter(e.target.value);setEvent({id:'',title:'',assets:[],checks:[]});setLimit(12);}}><option value="All">{t('全部来源','All sources')}</option>{[...new Set(events.map(e=>e.sourceName).filter(Boolean))].sort().map(n=><option key={n} value={n}>{n}</option>)}</select></label><span>{events.length} {t('条去重记录','unique records')} · {t('近 30 天，按发布时间排序','Last 30 days, newest first')}</span><button disabled={loading} onClick={refresh}>{loading?t('更新中…','Updating…'):t('更新新闻','Refresh news')}</button></div><details className="source-health"><summary>{t('查看来源覆盖与抓取状态','Source coverage & fetch status')} · {newsInfo?.providers?.filter(p=>p.status==='ok').length??0}/{newsInfo?.providers?.length??0}</summary><div>{newsInfo?.providers?.map(p=><p key={p.name}><a href={p.url} target="_blank" rel="noreferrer">{p.name}</a> · {p.status==='ok'?t('已获取','Fetched'):t('暂不可用','Unavailable')} · {p.count??0} {t('条记录','records')}{p.checkedAt?' · '+new Date(p.checkedAt).toLocaleTimeString():''}</p>)}</div><p>{t('来源失败不会填入模拟新闻。资产关联为关键词线索；不同报道不等于独立确认。','Failed feeds are not replaced with mock news. Asset links are keyword leads; separate reports are not independent confirmation.')}</p></details>{assetPicker}<div className="research-layout">{list}<div className="reading-column">{localizeTree(story,lang)}{chosen?.assets?.length>0&&<details className="market-disclosure">
<summary>{t('查看 Bitget 行情与事件前后变化','Bitget quotes & event-window price changes')}</summary>{marketPanel(chosen)}</details>}{chosen&&<details className="market-disclosure">
<summary>{t('深入查看事件推理','Explore deeper event reasoning')}</summary>{reasoning(chosen)}</details>}</div>{chosen&&<section className="next-action">
<small>{t('下一步','NEXT STEP')}</small>
<h2>{t('检查你的交易想法','Challenge your trade')}</h2>
<p>{t('先选一个意向，系统会准备研究问题。你可以继续修改，再提交检查。','Choose an intent to prepare a research question. Edit it before running the check.')}</p>
<div className="intent-buttons">{[[t('买入','buying'),t('买入','Buy')],[t('卖出','selling'),t('卖出','Sell')],[t('观望','waiting'),t('观望','Wait')]].map(([v,label])=>
<button key={v} onClick={()=>inspect(v)}>{label}</button>)}</div>
<button className="primary" onClick={()=>inspect(t('观望','waiting'))}>{t('开始检查想法','Check my thesis')}</button>
<p className="small">{t('基础检查无需 API Key。AI 深入分析可使用你自己的模型。','Basic checks need no key. Bring your model for deeper AI analysis.')}</p>
</section>}</div>{chosen&&<EventDetective key={'detective-'+chosen.id} event={chosen} lang={lang} report={report} onChallenge={(text,peers)=>{setComparisonPeers(peers);setEvent(chosen);setThesis(text);setChecking(true);navigate('Event');}}/>}{chosen&&<DecisionPlan key={chosen.id} event={chosen} lang={lang} onUse={text=>{setEvent(chosen);setThesis(text.slice(0,2000));setChecking(true);navigate('Event');}}/>}{(checking||report)&&<div className="guided-challenge" ref={checkRef}>{challenge}</div>}</>}</main>
<footer className="experience-footer">
<span>ASKSTONE · REMEMBER WHY</span>
<span>{t('研究辅助 · 由你做决定','Research support · Your decision')}</span>
<button onClick={refresh} disabled={loading}>{loading?t('刷新中…','Refreshing…'):t('刷新来源','Refresh sources')}</button>
</footer>
</div>;
}
