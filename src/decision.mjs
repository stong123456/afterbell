export function thesisType(text){
 if(/超跌|反弹|overdone|oversold|rebound|bounce/i.test(text))return 'rebound';
 if(/突破|趋势|动量|breakout|momentum|trend/i.test(text))return 'momentum';
 if(/财报|盈利|收入|earnings|revenue|profit/i.test(text))return 'earnings';
 return 'event';
}
export function eventLens(event,lang='zh'){
 const en=lang==='en',text=`${event.title} ${event.summary}`;
 const variants=[
  [/出口|关税|制裁|export|tariff|sanction/i,'政策与供应链','Policy & supply chains','政策范围与豁免 → 受影响业务敞口 → 收入或成本预期','Policy scope and exemptions → business exposure → revenue or cost expectations','区分提议、正式发布与实际生效；查公司地区收入及豁免。','Distinguish proposals from enacted rules; check geographic revenue and exemptions.'],
  [/财报|盈利|earnings|revenue|profit/i,'盈利与预期差','Earnings & expectations','已报告业绩和指引 → 与事前预期比较 → 盈利预期修正','Reported results and guidance → compare with prior expectations → earnings revisions','增长不等于超预期；核对收入、利润率、指引和事前一致预期。','Growth is not necessarily a beat; verify revenue, margins, guidance and prior consensus.'],
  [/利率|通胀|美联储|cpi|inflation|federal reserve|interest rate/i,'利率与估值','Rates & valuation','通胀或政策意外 → 利率路径预期 → 融资成本与估值','Inflation or policy surprise → expected rate path → financing costs and valuation','区分增长改善与通胀冲击；不能把季调指数直接当同比通胀率。','Separate growth strength from inflation shocks; an adjusted index is not an annual inflation rate.'],
  [/perps|perpetual|tokeniz|上市|代币化|合约/i,'市场结构与产品','Market structure & products','产品申请或上线 → 交易渠道与流动性变化 → 潜在价格发现变化','Product filing or launch → trading access and liquidity → possible price discovery effects','申请不等于获批；新增衍生品不等于公司基本面改善或现货需求增长。','A filing is not approval; new derivatives do not establish improved fundamentals or spot demand.']
 ];
 const v=variants.find(v=>v[0].test(text));
 return v?{label:v[en?2:1],path:v[en?4:3],counter:v[en?6:5]}:{label:en?'Event impact':'事件影响',path:en?'Verify the event → identify business exposure → compare market response':'核实事件 → 确认业务敞口 → 比较市场反应',counter:en?'A headline or price move alone cannot establish causality or an edge.':'标题或价格变化本身不能证明因果关系或交易优势。'};
}
export function readDecision(storage,key){try{const d=JSON.parse(storage.getItem(key)||'null');if(!d||typeof d!=='object')return {};return Object.fromEntries(Object.entries(d).filter(([k,v])=>['horizon','trigger','invalidation','risk','notes','review'].includes(k)&&typeof v==='string'&&v.length<=2000));}catch{return {};}}
export function planText(d,lang='zh'){const labels=lang==='en'?['Time horizon','Entry condition','Invalidation','Risk budget','Notes']:['观察周期','触发条件','推翻条件','风险预算','研究笔记'];return ['horizon','trigger','invalidation','risk','notes'].map((k,i)=>d[k]?`${labels[i]}: ${d[k]}`:'').filter(Boolean).join('\n');}
