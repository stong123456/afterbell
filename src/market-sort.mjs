export function sortMarkets(assets,key='change24hPct',direction='desc'){
 const allowed=['symbol','price','change24hPct','volume24hToken','volume24hUSDT','quoteTimestamp'];
 if(!allowed.includes(key))key='change24hPct';
 const sign=direction==='asc'?1:-1;
 return [...assets].sort((a,b)=>{
  const tie=()=>String(a.symbol).localeCompare(String(b.symbol))||String(a.pair).localeCompare(String(b.pair));
  if(key==='symbol')return sign*tie();
  const x=a[key],y=b[key],vx=Number.isFinite(x),vy=Number.isFinite(y);
  if(!vx||!vy)return vx?-1:vy?1:tie();
  return sign*(x-y)||tie();
 });
}
