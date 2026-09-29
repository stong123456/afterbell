import React,{useEffect,useState} from 'react';
// Catalog symbols are underlying tickers, never token-pair strings.
export function StockLogo({symbol}){
 const ticker=typeof symbol==='string'&&/^[A-Z0-9.]{1,16}$/.test(symbol)?symbol:'?';
 return <Logo key={ticker} ticker={ticker}/>;
}
function Logo({ticker}){
 const [attempt,setAttempt]=useState(0),[loaded,setLoaded]=useState(false);
 const sources=ticker==='?'?[]:[`https://financialmodelingprep.com/image-stock/${encodeURIComponent(ticker)}.png`,`https://companiesmarketcap.com/img/company-logos/64/${encodeURIComponent(ticker)}.png`];
 const src=sources[attempt];
 useEffect(()=>{if(!src||loaded)return;const timer=setTimeout(()=>setAttempt(n=>n+1),10000);return()=>clearTimeout(timer);},[src,loaded]);
 const next=()=>{setLoaded(false);setAttempt(n=>n+1);};
 return <span className="stock-logo stock-logo-frame" title={ticker}>
  {!loaded&&<span className="stock-logo-code" role="img" aria-label={ticker+' ticker symbol'}>{ticker.slice(0,4)}</span>}
  {src&&<img key={src} src={src} alt={ticker+' logo'} width="36" height="36" decoding="async" referrerPolicy="no-referrer" style={{opacity:loaded?1:0}} onLoad={e=>{if(e.currentTarget.naturalWidth>2)setLoaded(true);else next();}} onError={next}/>}
 </span>;
}
