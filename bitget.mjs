import {eventWindows} from './src/detective.mjs';

const validSymbol=s=>typeof s==='string'&&/^[A-Z0-9.]{1,16}$/.test(s);
const base='https://api.bitget.com';const cache=new Map(),pending=new Map();
const n=x=>x===null||x===undefined||String(x).trim()===''?null:Number.isFinite(Number(x))?Number(x):null;
const positive=x=>n(x)>0?n(x):null;
async function load(path,ttl=15000,timeout=6000){
 const old=cache.get(path);if(old&&Date.now()-old.at<ttl)return old.value;
 if(pending.has(path))return pending.get(path);
 const job=(async()=>{const r=await fetch(base+path,{signal:AbortSignal.timeout(timeout)});if(!r.ok)throw Error('BITGET_HTTP_'+r.status);const d=await r.json();if(d.code!=='00000')throw Error('BITGET_CODE_'+String(d.code).replace(/[^0-9]/g,''));cache.set(path,{at:Date.now(),value:d.data});return d.data;})();pending.set(path,job);
 try{return await job;}finally{pending.delete(path);}
}
const snapshotSource='https://stonedaily.xyz/api/markets?kind=stocks';
export function normalizeStockSnapshot(d,now=Date.now()){
 const provider=d?.providers?.find(p=>p.name==='Bitget'&&p.status==='live');
 const at=Date.parse(provider?.updatedAt||d?.updatedAt);
 if(!provider||!Number.isFinite(at)||at>now||now-at>300000)throw Error('STALE_STOCK_SNAPSHOT');
 const seen=new Set();
 const assets=(Array.isArray(d.assets)?d.assets:[]).flatMap(a=>{
  const symbol=a.underlying;
  if(!validSymbol(symbol)||a.venue!=='Bitget'||a.productType!=='tokenized-spot'||a.feedMode!=='live'||a.symbol!==`r${symbol}`||a.quoteCurrency!=='USDT'||!positive(a.price)||seen.has(symbol))return [];
  seen.add(symbol);
  return [{symbol,pair:`R${symbol}USDT`,baseCoin:a.symbol,status:'online',price:positive(a.price),change24hPct:n(a.change24h),volume24hUSDT:n(a.volume),quoteTimestamp:null}];
 }).sort((a,b)=>(b.volume24hUSDT??-1)-(a.volume24hUSDT??-1));
 if(!assets.length)throw Error('NO_VALID_STOCK_SNAPSHOT');
 return {status:'partial',assets,provider:'Bitget via StoneDaily',fallback:true,snapshotAt:new Date(at).toISOString(),retrievedAt:new Date(now).toISOString(),source:snapshotSource};
}
async function stockSnapshot(){
 const old=cache.get(snapshotSource);if(old&&Date.now()-old.at<15000)return normalizeStockSnapshot(old.value);
 if(pending.has(snapshotSource))return pending.get(snapshotSource);
 const job=(async()=>{const r=await fetch(snapshotSource,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('SNAPSHOT_UNAVAILABLE');const raw=await r.json();const value=normalizeStockSnapshot(raw);cache.set(snapshotSource,{at:Date.now(),value:raw});return value;})();pending.set(snapshotSource,job);
 try{return await job;}finally{pending.delete(snapshotSource);}
}
async function snapshotMarket(symbol,reason){
 const d=await stockSnapshot(),a=d.assets.find(a=>a.symbol===symbol);if(!a)throw Error('NO_VERIFIED_RTOKEN');
 return {...a,status:'partial',provider:d.provider,fallback:true,reason,quoteCurrency:'USDT',tradingStatus:a.status,snapshotAt:d.snapshotAt,retrievedAt:d.retrievedAt,source:d.source,bookTimestamp:null,tradeTimestamp:null,spreadPct:null,bids:[],asks:[],bidDepthUSDT:null,askDepthUSDT:null,depthLevels:0,candles:[]};
}
export function normalizeMarket(symbol,info,ticker,book,candles,now=Date.now()){
 const pair=`R${symbol}USDT`;
 if(!validSymbol(symbol)||info?.symbol!==pair||info.baseCoin!==`r${symbol}`||info.quoteCoin!=='USDT')throw Error('UNVERIFIED_PRODUCT');
 const rows=(candles||[]).map(c=>({time:n(c[0]),open:positive(c[1]),high:positive(c[2]),low:positive(c[3]),close:positive(c[4]),volume:n(c[5])})).filter(c=>c.time>0&&c.time<=now&&c.close&&c.open&&c.high&&c.low).sort((a,b)=>a.time-b.time);
 const levels=a=>(a||[]).map(([p,q])=>[positive(p),positive(q)]).filter(([p,q])=>p&&q).slice(0,5);
 const asks=levels(book?.asks).sort((a,b)=>a[0]-b[0]),bids=levels(book?.bids).sort((a,b)=>b[0]-a[0]);
 const bid=bids[0]?.[0],ask=asks[0]?.[0];const validBook=bid>0&&ask>=bid;
 const quote=ticker?.symbol===pair?ticker:null;
 return{status:quote?'ok':'partial',provider:'Bitget',symbol,pair,baseCoin:info.baseCoin,quoteCurrency:'USDT',tradingStatus:info.status,price:positive(quote?.lastPr),change24hPct:n(quote?.change24h)===null?null:n(quote.change24h)*100,volume24hUSDT:n(quote?.usdtVolume),quoteTimestamp:n(quote?.ts),bookTimestamp:n(book?.ts),retrievedAt:new Date(now).toISOString(),tradeTimestamp:null,spreadPct:validBook?(ask-bid)/((ask+bid)/2)*100:null,bids,asks,bidDepthUSDT:bids.reduce((s,[p,q])=>s+p*q,0),askDepthUSDT:asks.reduce((s,[p,q])=>s+p*q,0),depthLevels:5,candles:rows,source:`${base}/api/v2/spot/market/tickers?symbol=${pair}`};
}
export async function bitgetMarket(symbol){
 if(!validSymbol(symbol))return{status:'unavailable',symbol,reason:'UNSUPPORTED_ASSET'};
 try{
  const pair=`R${symbol}USDT`;const infos=await load('/api/v2/spot/public/symbols',300000);const info=infos.find(i=>i.symbol===pair);
  if(!info)return{status:'unavailable',symbol,reason:'NO_VERIFIED_RTOKEN'};
  const results=await Promise.allSettled([load(`/api/v2/spot/market/tickers?symbol=${pair}`),load(`/api/v2/spot/market/orderbook?symbol=${pair}&type=step0&limit=5`),load(`/api/v2/spot/market/candles?symbol=${pair}&granularity=1h&limit=168`,60000)]);
  const value=i=>results[i].status==='fulfilled'?results[i].value:null;
  const result=normalizeMarket(symbol,info,value(0)?.[0],value(1),value(2));
  if(!result.price){try{return await snapshotMarket(symbol,'BITGET_QUOTE_UNAVAILABLE');}catch{}}
  return result;
 }catch(e){const reason=/^BITGET_(HTTP|CODE)_/.test(e.message)?e.message:'BITGET_UNAVAILABLE';try{return await snapshotMarket(symbol,reason);}catch{return{status:'unavailable',symbol,reason};}}
}
export async function bitgetEvidence(assets){
 const results=await Promise.all(assets.filter(validSymbol).slice(0,3).map(bitgetMarket));
 return results.filter(r=>r.price!==null&&r.price!==undefined).map((r,i)=>({id:`BG${i+1}`,kind:'market-snapshot',title:`Bitget ${r.pair} · ${r.fallback?'StoneDaily snapshot':'direct snapshot'}`,summary:JSON.stringify({...r,candles:undefined}),url:r.source,publishedAt:null,scope:r.fallback?'aggregated-token-snapshot; quote-time-unknown; not-equity-close':'direct-token-quote-not-equity-close; timestamps-in-summary'}));
}
export function browserMarketEvidence(value,assets,now=Date.now()){
 if(!value||!assets.includes(value.symbol)||!validSymbol(value.symbol)||value.pair!==`R${value.symbol}USDT`||!Number.isFinite(value.price)||value.price<=0||!Number.isFinite(value.quoteTimestamp)||Math.abs(now-value.quoteTimestamp)>120000)return [];
 const fields=['symbol','pair','price','quoteTimestamp','bookTimestamp','retrievedAt','change24hPct','volume24hUSDT','spreadPct','bidDepthUSDT','askDepthUSDT'];
 const safe=Object.fromEntries(fields.map(k=>[k,value[k]]).filter(([,v])=>typeof v==='number'?Number.isFinite(v):typeof v==='string'&&v.length<80));
 return[{id:'BG_BROWSER',kind:'market-snapshot',title:`Bitget ${value.pair} · browser snapshot`,summary:JSON.stringify(safe),url:`${base}/api/v2/spot/market/tickers?symbol=${value.pair}`,publishedAt:null,scope:'browser-submitted; format-validated-not-server-source-verified; not-equity-close'}];
}

export function normalizeCatalog(infos,tickers=[]){
 const quotes=new Map(tickers.map(q=>[q.symbol,q]));
 return infos.filter(i=>/^r[A-Z0-9.]{1,16}$/.test(i.baseCoin)&&i.quoteCoin==='USDT'&&i.symbol===i.baseCoin.toUpperCase()+'USDT').map(i=>{const q=quotes.get(i.symbol);return {symbol:i.baseCoin.slice(1),pair:i.symbol,baseCoin:i.baseCoin,status:i.status,price:positive(q?.lastPr),change24hPct:n(q?.change24h)===null?null:n(q.change24h)*100,volume24hUSDT:n(q?.usdtVolume),quoteTimestamp:n(q?.ts)};}).sort((a,b)=>(b.volume24hUSDT??-1)-(a.volume24hUSDT??-1));
}
export async function bitgetCatalog(){try{const infos=await load('/api/v2/spot/public/symbols',300000);let ticks=[];try{ticks=await load('/api/v2/spot/market/tickers',30000,12000);}catch{}if(!ticks.length){try{return await stockSnapshot();}catch{}}return {status:ticks.length?'ok':'partial',assets:normalizeCatalog(infos,ticks),retrievedAt:new Date().toISOString(),source:base+'/api/v2/spot/public/symbols'};}catch(e){try{return {...await stockSnapshot(),reason:e.message};}catch{return {status:'unavailable',assets:[],reason:e.message,retrievedAt:new Date().toISOString()};}}}

export async function comparisonEvidence(event,peers){
 if(!Array.isArray(peers))return [];
 const assets=[...new Set(peers.filter(validSymbol))].slice(0,4);
 const markets=await Promise.all(assets.map(bitgetMarket));
 return markets.filter(m=>m.pair).map((m,i)=>({id:`M${i+1}`,kind:'market-snapshot',title:`${m.symbol} aligned event windows`,summary:JSON.stringify({symbol:m.symbol,windows:eventWindows(m,event.publishedAt),price:m.price,spreadPct:m.spreadPct,quoteTimestamp:m.quoteTimestamp,retrievedAt:m.retrievedAt}),url:m.source,publishedAt:null,scope:'server-retrieved; completed-hour-candles; not-causal-evidence'}));
}
