import {symbols} from './src/research.mjs';
const base='https://api.bitget.com';const cache=new Map(),pending=new Map();
const n=x=>x===null||x===undefined||String(x).trim()===''?null:Number.isFinite(Number(x))?Number(x):null;
const positive=x=>n(x)>0?n(x):null;
async function load(path,ttl=15000){
 const old=cache.get(path);if(old&&Date.now()-old.at<ttl)return old.value;
 if(pending.has(path))return pending.get(path);
 const job=(async()=>{const r=await fetch(base+path,{signal:AbortSignal.timeout(6000)});if(!r.ok)throw Error('BITGET_HTTP_'+r.status);const d=await r.json();if(d.code!=='00000')throw Error('BITGET_CODE_'+String(d.code).replace(/[^0-9]/g,''));cache.set(path,{at:Date.now(),value:d.data});return d.data;})();pending.set(path,job);
 try{return await job;}finally{pending.delete(path);}
}
export function normalizeMarket(symbol,info,ticker,book,candles,now=Date.now()){
 const pair=`R${symbol}USDT`;
 if(!symbols.includes(symbol)||info?.symbol!==pair||info.baseCoin?.toUpperCase()!==`R${symbol}`||info.quoteCoin!=='USDT')throw Error('UNVERIFIED_PRODUCT');
 const rows=(candles||[]).map(c=>({time:n(c[0]),open:positive(c[1]),high:positive(c[2]),low:positive(c[3]),close:positive(c[4]),volume:n(c[5])})).filter(c=>c.time>0&&c.time<=now&&c.close&&c.open&&c.high&&c.low).sort((a,b)=>a.time-b.time);
 const levels=a=>(a||[]).map(([p,q])=>[positive(p),positive(q)]).filter(([p,q])=>p&&q).slice(0,5);
 const asks=levels(book?.asks).sort((a,b)=>a[0]-b[0]),bids=levels(book?.bids).sort((a,b)=>b[0]-a[0]);
 const bid=bids[0]?.[0],ask=asks[0]?.[0];const validBook=bid>0&&ask>=bid;
 const quote=ticker?.symbol===pair?ticker:null;
 return{status:quote?'ok':'partial',provider:'Bitget',symbol,pair,baseCoin:info.baseCoin,quoteCurrency:'USDT',tradingStatus:info.status,price:positive(quote?.lastPr),change24hPct:n(quote?.change24h)===null?null:n(quote.change24h)*100,volume24hUSDT:n(quote?.usdtVolume),quoteTimestamp:n(quote?.ts),bookTimestamp:n(book?.ts),retrievedAt:new Date(now).toISOString(),tradeTimestamp:null,spreadPct:validBook?(ask-bid)/((ask+bid)/2)*100:null,bids,asks,bidDepthUSDT:bids.reduce((s,[p,q])=>s+p*q,0),askDepthUSDT:asks.reduce((s,[p,q])=>s+p*q,0),depthLevels:5,candles:rows,source:`${base}/api/v2/spot/market/tickers?symbol=${pair}`};
}
export async function bitgetMarket(symbol){
 if(!symbols.includes(symbol))return{status:'unavailable',symbol,reason:'UNSUPPORTED_ASSET'};
 try{
  const pair=`R${symbol}USDT`;const infos=await load('/api/v2/spot/public/symbols',300000);const info=infos.find(i=>i.symbol===pair);
  if(!info)return{status:'unavailable',symbol,reason:'NO_VERIFIED_RTOKEN'};
  const results=await Promise.allSettled([load(`/api/v2/spot/market/tickers?symbol=${pair}`),load(`/api/v2/spot/market/orderbook?symbol=${pair}&type=step0&limit=5`),load(`/api/v2/spot/market/candles?symbol=${pair}&granularity=1h&limit=168`,60000)]);
  const value=i=>results[i].status==='fulfilled'?results[i].value:null;
  return normalizeMarket(symbol,info,value(0)?.[0],value(1),value(2));
 }catch(e){return{status:'unavailable',symbol,reason:/^BITGET_(HTTP|CODE)_/.test(e.message)?e.message:'BITGET_UNAVAILABLE'};}
}
export async function bitgetEvidence(assets){
 const results=await Promise.all(assets.filter(s=>symbols.includes(s)).slice(0,3).map(bitgetMarket));
 return results.filter(r=>r.price!==null&&r.price!==undefined).map((r,i)=>({id:`BG${i+1}`,kind:'market-snapshot',title:`Bitget ${r.pair} · direct snapshot`,summary:JSON.stringify({...r,candles:undefined}),url:r.source,publishedAt:null,scope:'direct-token-quote-not-equity-close; timestamps-in-summary'}));
}
export function browserMarketEvidence(value,assets,now=Date.now()){
 if(!value||!assets.includes(value.symbol)||!symbols.includes(value.symbol)||value.pair!==`R${value.symbol}USDT`||!Number.isFinite(value.price)||value.price<=0||!Number.isFinite(value.quoteTimestamp)||Math.abs(now-value.quoteTimestamp)>120000)return [];
 const fields=['symbol','pair','price','quoteTimestamp','bookTimestamp','retrievedAt','change24hPct','volume24hUSDT','spreadPct','bidDepthUSDT','askDepthUSDT'];
 const safe=Object.fromEntries(fields.map(k=>[k,value[k]]).filter(([,v])=>typeof v==='number'?Number.isFinite(v):typeof v==='string'&&v.length<80));
 return[{id:'BG_BROWSER',kind:'market-snapshot',title:`Bitget ${value.pair} · browser snapshot`,summary:JSON.stringify(safe),url:`${base}/api/v2/spot/market/tickers?symbol=${value.pair}`,publishedAt:null,scope:'browser-submitted; format-validated-not-server-source-verified; not-equity-close'}];
}
