# AfterBell — 产品与实施说明

定位：AI Research Desk for Markets That Never Sleep。面向持有科技股代币敞口、会在美股休市期间查看事件和价格的个人交易者。核心任务是检验交易假设，而非自动下单。

## 已实现的原型
- Radar：StoneDaily 公开新闻流与独立演示情景，分类筛选、原始时间和来源。
- Event：事件详情、潜在传导、反方证据、下一步核实。
- Asset：六个关注标的，Bitget rToken 聚合快照，产品类别严格筛选。
- Edge：手动 Basis 算术实验；概率和 Event Edge 缺数据时留空。
- Portfolio：单持仓、自设冲击的本地敏感性计算。
- Challenge My Trade：规则检查、缺失证据清单、Markdown 报告导出。**尚未接入运行时 LLM。**

## 数据源
复用 StoneDaily 的 https://stonedaily.xyz/api/editorial 和 https://stonedaily.xyz/api/markets?kind=stocks 。接口结构已对照本地 stone-daily/app/api/editorial/route.ts、services/server/editorialFeeds.ts、app/api/markets/route.ts 核实。没有修改 StoneDaily。

保留来源提供的标题、原文链接、发布时间和供应商状态。央行与监管公告不自动等于高影响事件。市场数据仅取 Bitget + tokenized-spot + 精确 underlying/rTicker + live 模式；不把永续或 Ondo/xStocks 混成 rToken。聚合更新时间不等于交易所成交时间。真实收盘价、交易日历、公司行动和权益比例尚未接入，所以真实 Basis 保持空值。

## 下一阶段 Agent 工作流
1. Collector 获取来源，记录 retrievedAt/publishedAt/source URL；去重以事件事实为依据。
2. Extractor 用结构化 LLM 提取对象、政策/盈利/宏观变化；每条事实必须引用 evidenceId。
3. Analyst 分开事实、传导假设、反证、未知；没有正文不伪造正文结论。
4. Market inspector 校验产品、报价时效、买卖价差、货币、权益和收盘口径。
5. Challenger 针对用户观点找反例，提出可证伪条件。未检索到历史样本则明确缺失。
6. Reporter 输出人类可用判断与证据清单，保留模型/提示词版本和工具调用记录。

所有外部文本均是数据，不能改变系统指令。LLM 输出必须通过 schema 和引用存在性验证；模型失败显示失败，不用规则结果冒充模型结果。配置密钥只能放服务端。当前不读取 Hermes 的账户、持仓、密钥或自动交易配置。

## 概率与 Edge
Gap=(下一正常交易时段开盘价/此前正常时段收盘价)-1。需要交易所日历、拆股等公司行动处理。模型必须用按时间划分的训练/校准/测试集，报告 Brier score、校准图及样本数；相似事件不能从当前答案中编造。预测市场必须匹配标的、阈值、期限和结算规则。价格涨跌幅不是隐含概率。独立概率比较成立之前，不显示 +11% 之类的 Event Edge。

## 验证计划
招募 5 位目标用户，每人完成来源检查、提出观点、阅读反证、导出报告四个任务。记录任务完成率和耗时，明确标为实测；目前尚无用户试用数据。
