import {thesisType,eventLens} from './decision.mjs';
export const symbols=['NVDA','AAPL','TSLA','TSM','AMD','XOM'];
export const scenarios=[
 {id:'chips',category:'Policy',title:'Chip export restrictions tighten',summary:'芯片出口管制收紧可能影响供应链、销售区域与未来收入预期。',assets:['NVDA','AMD','TSM'],mechanism:'出口许可变化 → 可服务市场缩小 → 收入预期修正 → 估值重新定价',counter:'政策可能存在豁免、过渡期；公司收入地域结构决定实际敏感度。',checks:['核实政策生效日期、产品范围与豁免','查阅公司受影响收入占比','比较同业表现和买卖价差']},
 {id:'rates',category:'Macro',title:'Rates stay higher for longer',summary:'利率路径变化可能通过贴现率和融资成本传导至成长股。',assets:['AAPL','TSLA'],mechanism:'利率预期上修 → 贴现率上升 → 长久期资产估值承压',counter:'若利率上升来自增长改善，盈利增长可能部分抵消估值压力。',checks:['区分通胀冲击与增长冲击','核实国债收益率变化','检查事件前市场预期']},
 {id:'energy',category:'Macro',title:'Energy supply disruption',summary:'供应中断可能影响能源价格、运输成本和风险偏好。',assets:['XOM','TSLA'],mechanism:'供应下降 → 能源成本变化 → 行业利润分化',counter:'库存释放、替代供应和需求下降可能缓解冲击。',checks:['核实实际供应损失','检查库存与替代产能','区分油价影响与整体风险偏好']}
].map(x=>({...x,kind:'scenario',source:null,publishedAt:null}));
export function basis({token,close,fx=1,ratio=1}){if(![token,close,fx,ratio].every(x=>Number.isFinite(x)&&x>0))return null;return(token*fx/ratio/close-1)*100;}
export function stress(value,shock){return Number.isFinite(value)&&value>=0&&Number.isFinite(shock)&&shock>=-100&&shock<=100?value*shock/100:null;}
export function challenge(thesis,event,lang='zh'){
 if(typeof thesis!=='string'||thesis.trim().length<10||thesis.length>2000)throw Error('请填写 10–2000 字的交易观点。');
 const rebound=thesisType(thesis)==='rebound';const lens=eventLens(event,lang);
 return {mode:'rules',createdAt:new Date().toISOString(),thesis,event:event.title,verdict:'证据不足，暂不能确认交易假设',probability:null,checks:[{title:rebound?'下跌本身不能证明超跌':'把方向判断改写成可证伪假设',body:rebound?'需要证明价格变化超过基本面影响；价格跌幅不能单独支持反弹。':'明确标的、时间窗口、触发条件，以及什么证据会推翻你的观点。'},{title:'检查事件传导',body:event.kind==='source'?lens.path:event.mechanism},{title:'主动寻找反证',body:event.kind==='source'?lens.counter:event.counter},{title:'检查市场可交易性',body:'核实 rToken 身份、报价时间、买卖价差、流动性和赎回约束；缺少这些信息时不能判断价格偏离。'}],missing:['尚无可验证历史相似事件样本','尚无校准后的开盘 Gap 概率模型',event.kind==='scenario'?'情景内容不等同于已发生新闻':'来源正文与交易影响尚未人工核实'],next:event.checks};
}
