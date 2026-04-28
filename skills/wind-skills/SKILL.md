---
name: wind-skills
description: >-
  Wind 万得金融数据合并桥接 skill。两类能力按 server_type 路由：(1) `quote` 行情类（A 股 / 港股实时行情快照、K 线日 / 周 / 月、分钟级行情、万得板块成分）；(2) `financial-data` 基本面 + RAG（财报指标、估值倍数、宏观经济、跨标的对比、新闻 / 研报 / 公告 / 年报检索）。需要 WIND_API_KEY（登录 aimarket.wind.com.cn 开发者中心获取）。触发场景：A 股 / 港股股票代码查询、K 线走势、分钟数据、万得板块成员、财报指标、宏观数值、跨指数对比、上市公司公告 / 年报检索、新闻摘要、研报片段。**不包含**：美股 / 欧股 / 日股、汇率、期货盘口、加密货币、非金融数据。
version: 1.0.0
author: Wind AIMarket
homepage: https://aimarket.wind.com.cn
---

# Wind 万得数据 (合并版)

本 skill 合并万得两个 MCP server（`vserver_wind_quote` + `vserver_wind_financial_data`），按 `server_type` 路由调用。

## 何时使用

**✅ 触发场景：**

行情类（`server_type=quote`）：
- A 股 / 港股最新行情（价格 / 涨跌 / 成交）
- K 线（日 / 周 / 月 / 前复权 / 后复权）
- 分钟级行情
- 万得板块（行业 / 概念 / 主题 / 风格）成分

基本面 + RAG 类（`server_type=financial-data`）：
- 财报数值指标（营收 / 利润 / 资产负债 / 现金流 / 财务比率）
- 估值倍数（PE / PB / PS / 股息率）、跨标的对比
- 宏观经济、行业指标
- 公告 / 定期报告 / 年报 / 招股书 / 监管文件
- 财经新闻摘要、研报片段

**❌ 不触发场景：**
- 美股 / 欧股 / 非中概股
- 汇率 / 期货盘口 / 加密货币
- 非金融数据

## 工作流程

> 所有命令在 skill 目录下运行（cwd = skill 根），用相对路径 `scripts/cli.mjs`。

### Step 1: 看可用工具

```bash
node scripts/cli.mjs list-tools quote
node scripts/cli.mjs list-tools financial-data
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
3. 用户登录 / 拿 Key 后，按 cli.mjs 提示三选一配置（推荐 C: 全局 `~/.wind-aimarket/config`）

## 工具表

### server_type=quote (4 个)

| 工具 | 说明 | 示例参数 |
|---|---|---|
| `quote_get_indicators` | 实时行情快照 | `{"windcode":"600519.SH","indexes":"NAME,MATCH,CHANGERANGE"}` |
| `quote_get_kline` | K 线（日 / 周 / 月） | `{"windcode":"600519.SH","period":"D","count":30}` |
| `quote_get_minute` | 分钟级行情 | `{"windcode":"600519.SH","date":"20260424"}` |
| `quote_sector_get_members_sorted` | 万得板块成分 | `{"sectorid":"a001010100000000"}` |

### server_type=financial-data (2 个)

| 工具 | 说明 | 示例参数 |
|---|---|---|
| `search_financial_data` | 自然语言查结构化数值 | `{"question":"贵州茅台 2024 年 ROE 和净利润增速"}` |
| `get_financial_documents` | 自然语言查金融文档 | `{"query":"贵州茅台 2024 年报","docType":"3","top_k":5}` |

`docType`：1=新闻 / 2=研报 / 3=公告（含年报 / 招股书 / 监管文件等）/ 不填=不限。

## 典型示例

```bash
# 例 A: 茅台最新价
node scripts/cli.mjs call quote quote_get_indicators '{"windcode":"600519.SH","indexes":"NAME,MATCH,CHANGERANGE,VOLUME"}'

# 例 B: 茅台近 30 日 K 线
node scripts/cli.mjs call quote quote_get_kline '{"windcode":"600519.SH","period":"D","count":30}'

# 例 C: 茅台财务指标
node scripts/cli.mjs call financial-data search_financial_data '{"question":"贵州茅台 2024 年 ROE 和营收增速"}'

# 例 D: 茅台年报
node scripts/cli.mjs call financial-data get_financial_documents '{"query":"贵州茅台 2024 年年度报告","docType":"3","top_k":3}'
```

## 自检（响应前）

- 用户问题是 A 股 / 港股 / 中国宏观 / 中概？是 → 用本 skill；否 → 不要套
- 选对 `server_type`：取数 / 行情 / K 线 / 板块 → `quote`；财报 / 估值 / 宏观值 / 文档 → `financial-data`
- 工具名拼对：先 `list-tools` 查；不要凭印象写
- 报"未配置 Key"时**先问用户**再跑 open-portal，不要无打招呼弹浏览器
