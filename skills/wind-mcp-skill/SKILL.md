---
name: wind-mcp-skill
description: >-
  Wind 万得 MCP 数据桥接 skill（v1.1.0，6 server / 19 工具）。按 `server_type` 路由：(1) `quote` 行情类（A 股 / 港股快照、K 线日 / 周 / 月、分钟）；(2) `fund_data` 基金类（档案 / 财务 / 持仓 / 业绩 / 持有人 / 公司）；(3) `stock_data` 股票深度（档案 / 财务基本面 / 股本 / 事件 / 技术指标 / 风险）；(4) `financial_docs` 文档 RAG（公告 / 财经新闻）；(5) `economic_data` EDB 宏观 + 行业经济指标；(6) `analytics_data` 通用 NL → Wind 数据。需要 WIND_API_KEY（登录 aimarket.wind.com.cn 开发者中心获取）。触发场景：A 股 / 港股代码 / K 线 / 分钟、基金任何维度、股票财报 / 估值、上市公司公告 / 财经新闻、宏观经济数据、跨标的对比。**不包含**：美股 / 欧股 / 日股、汇率 / 期货盘口、加密货币、非金融数据。
version: 1.1.0
author: Wind AIMarket
homepage: https://aimarket.wind.com.cn
---

# Wind 万得 MCP 数据桥接（v1.1.0）

本 skill 合并万得 6 个 MCP server，按 `server_type` 路由调用，共 19 个工具。

## 何时使用

**✅ 触发场景：**

| 场景 | server_type |
|---|---|
| A 股 / 港股最新行情、K 线、分钟 | `quote` |
| 基金任何维度（档案 / 财务 / 持仓 / 业绩 / 持有人 / 管理公司） | `fund_data` |
| 股票档案 / 财务基本面 / 股本结构 / 公司事件 / 技术指标 / 风险 | `stock_data` |
| 上市公司公告、财经新闻 | `financial_docs` |
| 宏观经济、行业经济指标（EDB） | `economic_data` |
| 不确定归属或跨域综合查询（fallback） | `analytics_data` |

**❌ 不触发场景：**
- 美股 / 欧股 / 非中概股
- 汇率 / 期货盘口 / 加密货币
- 非金融数据

## 工作流程

> 所有命令在 skill 目录下运行（cwd = skill 根）。

### Step 1: 看可用工具

```bash
node scripts/cli.mjs list-tools <server_type>
```

24h 缓存。返回工具 schema 数组。

### Step 2: 调用工具

```bash
node scripts/cli.mjs call <server_type> <tool_name> '<params_json>'
```

### Step 3: 没 Key 时引导用户

如果第一次调用报"WIND_API_KEY 未配置"：

1. **先问用户是否同意打开浏览器**（避免突然弹）
2. 同意后跑：`node scripts/cli.mjs open-portal`
3. 用户登录 / 拿 Key 后，按 cli.mjs 提示三选一配置（推荐 C：全局 `~/.wind-aimarket/config`，所有 wind skill 共享）

## 工具表（6 server / 19 工具）

### server_type=quote（3 个，结构化代码参数）

| 工具 | 说明 | 必填入参 |
|---|---|---|
| `quote_get_indicators` | 实时行情快照（最新价 / 涨跌 / 成交） | `windcode, indexes` |
| `quote_get_kline` | K 线（日 / 周 / 月，前复权 / 后复权 / 不复权） | `windcode` |
| `quote_get_minute` | 分钟级行情 | `windcode` |

### server_type=fund_data（6 个，自然语言入参）

入参统一：`{question, lang?, version?}`，`question` 必填。

| 工具 | 说明 |
|---|---|
| `get_fund_info` | 基金基本档案（代码 / 简称 / 投资风格 / 业绩基准 / 费率 / 现任经理） |
| `get_fund_financials` | 基金财务（利润 / 净值 / 收入 / 费用 / 分红） |
| `get_fund_holdings` | 持仓 + 资产配置（重仓股 / 申万 Wind 中信行业 / 投资风格） |
| `get_fund_performance` | 业绩 + 排名 + ETF / 二级交易数据 |
| `get_fund_shareholders` | 持有人结构（个人 / 机构 / 申购赎回 / 规模变动） |
| `get_fund_company_info` | 基金管理公司档案 + 经理团队指标 |

### server_type=stock_data（6 个，自然语言入参）

入参统一：`{question, lang?, version?}`，`question` 必填。

| 工具 | 说明 |
|---|---|
| `get_stock_basicinfo` | 股票基本档案（公司信息 / 主营 / 行业分类 / IPO 上市板） |
| `get_stock_fundamentals` | 财务基本面（盈利能力 / 资产负债 / 利润 / 现金流 / 增长率 / 杠杆） |
| `get_stock_equity_holders` | 股本 + 股东（总股本 / 流通 / 前十大 / 实控人 / 限售解禁） |
| `get_stock_events` | 事件 + 资本运作（IPO / 增发 / 配股 / 并购 / ST / 合规） |
| `get_stock_technicals` | 技术指标 + 交易（涨跌幅 / MACD / KDJ / RSI / BOLL / 融资融券 / 龙虎榜 / 涨跌停） |
| `get_risk_metrics` | 风险指标（Beta / Jensen Alpha / 波动率 / Sharpe） |

### server_type=financial_docs（2 个，文档 RAG）

| 工具 | 说明 | 入参 |
|---|---|---|
| `get_company_announcements` | 公司公告 / 监管文件 / 招股书 / 业绩公告 / 致股东信 | `query`（必填）+ `top_k / start_date / end_date` |
| `get_financial_news` | 财经新闻报道 | 同上 |

### server_type=economic_data（1 个，EDB 宏观 / 行业）

| 工具 | 说明 | 入参 |
|---|---|---|
| `get_economic_data` | EDB 宏观 / 行业经济指标（自动 NL → 指标 ID） | `metricIdsStr`（必填，自然语言问句）+ `beginDate / endDate / freq / magnitude / currency` |

> ⚠️ **当前后端 bug**：含具体年份 / freq / beginDate 等高级参数时偶发 `'str' object has no attribute 'get'` 报错（已反馈万得后端，2026-04-29）。**简单 NL 问句稳定通过**（例：`"中国GDP"` / `"近10年中国新能源汽车产销量"`）。

### server_type=analytics_data（1 个，通用 NL fallback）

入参：`{question, lang?, version?}`。

| 工具 | 说明 |
|---|---|
| `get_financial_data` | 自然语言 → Wind 通用数据（覆盖 fund / stock 之外的杂项 / 跨域综合查询） |

## 典型示例

```bash
# 行情类
node scripts/cli.mjs call quote quote_get_indicators '{"windcode":"600519.SH","indexes":"NAME,MATCH,CHANGERANGE,VOLUME"}'
node scripts/cli.mjs call quote quote_get_kline '{"windcode":"600519.SH","period":"D","count":30}'

# 股票深度
node scripts/cli.mjs call stock_data get_stock_fundamentals '{"question":"贵州茅台 2024 年 ROE 和净利润增速"}'
node scripts/cli.mjs call stock_data get_stock_basicinfo '{"question":"600519.SH 公司基本档案"}'

# 基金
node scripts/cli.mjs call fund_data get_fund_info '{"question":"易方达蓝筹精选 005827.OF 基金档案"}'
node scripts/cli.mjs call fund_data get_fund_holdings '{"question":"005827.OF 最新一期重仓股"}'

# 文档
node scripts/cli.mjs call financial_docs get_company_announcements '{"query":"贵州茅台 2024 年报","top_k":3}'
node scripts/cli.mjs call financial_docs get_financial_news '{"query":"美联储利率政策","top_k":5}'

# 宏观
node scripts/cli.mjs call economic_data get_economic_data '{"metricIdsStr":"中国GDP"}'

# 通用 fallback
node scripts/cli.mjs call analytics_data get_financial_data '{"question":"中证 500 最近一周表现"}'
```

## 自检（响应前）

- 用户问题是 A 股 / 港股 / 中国宏观 / 中概？是 → 用本 skill；否 → 不要套
- **选对 server_type**（最常出错处）：
  - 行情 / K 线 / 分钟 → `quote`
  - 基金任何维度 → `fund_data`
  - 股票档案 / 财务 / 股本 / 事件 / 技术 / 风险 → `stock_data`
  - 公告 / 新闻 → `financial_docs`
  - EDB 宏观 / 行业 → `economic_data`
  - 不确定 / 杂项跨域 → `analytics_data`
- 工具名拼对：先 `list-tools` 查；不要凭印象写
- 报"未配置 Key"时**先问用户**再跑 `open-portal`，不要无打招呼弹浏览器
- `economic_data` 复杂参数后端有 bug，遇报错降级为简单 NL 问句重试
