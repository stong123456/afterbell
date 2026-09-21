import React,{useState} from 'react';
// Symbols here are underlying tickers from the catalog, never token-pair strings.
export function StockLogo({symbol}){
 const [failed,setFailed]=useState('');
 if(!/^[A-Z0-9.]{1,16}$/.test(symbol)||failed===symbol)return null;
 return <img className="stock-logo" src={`https://financialmodelingprep.com/image-stock/${encodeURIComponent(symbol)}.png`} alt="" width="36" height="36" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(symbol)}/>;
}
