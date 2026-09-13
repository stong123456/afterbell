# AfterBell

可运行的事件研究台原型，React + Vite + Node。数据源复用 StoneDaily；当前压力测试为规则模式，非运行时 LLM。

顶部支持中文 / EN 切换，选择保存在浏览器本地。导航、场景说明、规则报告与 Markdown 导出随语言切换；新闻标题、来源摘要和用户输入保留原文。

English: AfterBell is a bilingual event research desk built with React, Vite and Node. It reuses StoneDaily public feeds and offers rule-based thesis challenges, manual basis calculations and position-shock scenarios. Switch between Chinese and English in the header. Original news and user input are never machine-translated. Runtime LLM integration and public website hosting are not included yet.

本地地址：http://127.0.0.1:4318

开发：`npm install`，`npm run build`，`npm start`。Node 22.12+。服务只绑定本地回环地址。`npm test` 验证算术和来源约束。

- [产品、数据源与 Agent 工作流](docs/PRODUCT.md)
- [参赛说明与演示脚本](docs/SUBMISSION.md)
- [后续开发提示词](docs/NEXT-CODEX-PROMPT.md)
- [视觉概念](design/concept.png)

公开部署、运行时大模型、真实收盘基准与历史概率模型尚未完成。没有下单接口；不会读取 Hermes 私人配置。
