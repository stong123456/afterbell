export function eventMove(market,publishedAt){
 const time=Date.parse(publishedAt);if(!Number.isFinite(time)||!market?.price)return null;
 const before=(market.candles||[]).filter(c=>c.time+3600000<=time).at(-1);
 if(!before||time-(before.time+3600000)>3600000||!before.close)return null;
 return{baseline:before.close,baselineAt:before.time+3600000,changePct:(market.price/before.close-1)*100};
}
