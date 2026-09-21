import {XMLParser} from 'fast-xml-parser';
export const FEEDS=[
 {id:'cnbc',name:'CNBC',url:'https://www.cnbc.com/id/100003114/device/rss/rss.html',category:'Macro'},
 {id:'fed',name:'Federal Reserve',url:'https://www.federalreserve.gov/feeds/press_all.xml',category:'Policy'},
 {id:'sec',name:'SEC',url:'https://www.sec.gov/news/pressreleases.rss',category:'Policy'},
 {id:'coindesk',name:'CoinDesk',url:'https://www.coindesk.com/arc/outboundfeeds/rss/',category:'Market'},
 {id:'decrypt',name:'Decrypt',url:'https://decrypt.co/feed',category:'Market'},
 {id:'techcrunch',name:'TechCrunch',url:'https://techcrunch.com/feed/',category:'Technology'}
];
const aliases={NVDA:/\bnvidia\b|\bNVDA\b|英伟达/i,AAPL:/\bapple\b|\bAAPL\b|苹果/i,TSLA:/\btesla\b|\bTSLA\b|特斯拉/i,AMD:/\bAMD\b|advanced micro devices|超微半导体/i,TSM:/\bTSMC?\b|taiwan semiconductor|台积电/i,MSFT:/\bmicrosoft\b|\bMSFT\b|微软/i,AMZN:/\bamazon\b|\bAMZN\b|亚马逊/i,GOOGL:/\bgoogle\b|\balphabet\b|\bGOOGL\b|谷歌/i,META:/\bmeta\b|facebook|扎克伯格/i,COIN:/\bcoinbase\b|\bCOIN\b/i,PLTR:/\bpalantir\b|\bPLTR\b/i,AVGO:/\bbroadcom\b|\bAVGO\b|博通/i,INTC:/\bintel\b|\bINTC\b|英特尔/i,NFLX:/\bnetflix\b|\bNFLX\b/i,XOM:/\bexxon\b|\bXOM\b/i,JPM:/jpmorgan|jp morgan|\bJPM\b/i,ORCL:/\boracle\b|\bORCL\b|甲骨文/i,BTC:/\bbitcoin\b|\bBTC\b|比特币/i,ETH:/\bethereum\b|\bETH\b|以太坊/i};
export function inferAssets(text,existing=[]){return [...new Set([...existing.filter(s=>typeof s==='string'&&/^[A-Z0-9.]{1,16}$/.test(s)),...Object.entries(aliases).filter(([,re])=>re.test(text)).map(([s])=>s)])];}
const clean=s=>String(typeof s==='object'?s?.['#text']||'':s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function canonical(url){try{const u=new URL(url);if(!['http:','https:'].includes(u.protocol))return null;u.hash='';for(const key of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(key))u.searchParams.delete(key);return u.toString().replace(/\/$/,'');}catch{return null;}}
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(36);};
export function parseFeed(xml,feed,now=Date.now()){
 if(xml.length>2000000||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('INVALID_FEED');
 const d=new XMLParser({ignoreAttributes:false,processEntities:true}).parse(xml);if(!d.rss?.channel&&!d.feed)throw Error('INVALID_FEED');
 const raw=d.rss?.channel?.item||d.feed?.entry||[];const items=Array.isArray(raw)?raw:[raw];
 return items.slice(0,60).flatMap(x=>{const title=clean(x.title),links=Array.isArray(x.link)?x.link:[x.link];const link=links.find(l=>typeof l==='string'||!l?.['@_rel']||l['@_rel']==='alternate');const source=canonical(typeof link==='string'?link:link?.['@_href']);const at=Date.parse(x.pubDate||x.published||x.updated||x['dc:date']);if(!title||!source||!Number.isFinite(at)||at>now||now-at>30*86400000)return [];const summary=clean(x.description||x.summary).slice(0,360);const assets=inferAssets(title+' '+summary);return [{id:'rss-'+hash(source),kind:'source',category:/earnings|quarterly results|财报/i.test(title)?'Earnings':feed.category,title,summary:summary||'Original source headline. Open the source to verify details.',source,sourceName:feed.name,publishedAt:new Date(at).toISOString(),assets,checks:['核实原文与发布时间 / Verify original and publication time','资产关联为关键词线索，不代表事件影响已获证实 / Asset links are keyword leads, not verified impacts']}];});
}
export function mergeEvents(groups,now=Date.now()){
 const seen=new Set();return groups.flat().filter(e=>{const key=canonical(e.source);if(!key||seen.has(key)||!Number.isFinite(Date.parse(e.publishedAt))||Date.parse(e.publishedAt)>now||now-Date.parse(e.publishedAt)>30*86400000)return false;seen.add(key);return true;}).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,240);
}
let cache=null,pending=null;
export async function rssNews(){if(cache&&Date.now()-cache.at<120000)return cache.data;if(pending)return pending;pending=(async()=>{const results=await Promise.all(FEEDS.map(async feed=>{try{const r=await fetch(feed.url,{signal:AbortSignal.timeout(8000),headers:{Accept:'application/rss+xml, application/atom+xml, application/xml, text/xml'}});if(!r.ok)throw Error('HTTP '+r.status);const events=parseFeed(await r.text(),feed);return {events,provider:{name:feed.name,url:feed.url,status:'ok',count:events.length,checkedAt:new Date().toISOString()}};}catch(e){return {events:[],provider:{name:feed.name,url:feed.url,status:'unavailable',count:0,reason:e.message,checkedAt:new Date().toISOString()}};}}));const data={events:mergeEvents(results.map(r=>r.events)),providers:results.map(r=>r.provider)};cache={at:Date.now(),data};return data;})();try{return await pending;}finally{pending=null;}}
