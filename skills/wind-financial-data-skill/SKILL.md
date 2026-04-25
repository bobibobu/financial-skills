---
name: wind-financial-data-skill
description: >-
  Wind 万得金融基本面数据 + 文档 RAG 检索。两个工具：(1) `search_financial_data` 自然语言查结构化数值数据（股票 / 基金 / ETF / 宏观指标 / 公司财务：营收 / 利润 / 资产负债 / 财务比率 / 增长率 / 估值倍数 / 跨指数对比）；(2) `get_financial_documents` 自然语言查金融文档（新闻 / 研报 / 公告 / 年报 / 招股书 / 监管文件，可按 docType 过滤）。需要 WIND_API_KEY（登录 aimarket.wind.com.cn 开发者中心获取）。触发场景：财报指标、宏观/行业数值、跨标的对比、上市公司公告/年报检索、新闻摘要、研报片段。**不包含**：实时行情 / K 线 / 板块成分（请用 wind-quote-skill）、美股 / 欧股 / 非中概股、汇率 / 期货盘口、非金融数据。
version: 0.2.0
author: Wind AIMarket
homepage: https://aimarket.wind.com.cn
---

# Wind 万得金融基本面数据 & RAG 检索

本 skill 专注万得金融基本面数据 + RAG 检索（对应 MCP server：`vserver_wind_financial_data`）。单一职责，零冗余。

## 何时使用

**✅ 触发场景：**
- 财报数值指标（营收 / 利润 / 资产负债 / 现金流 / 财务比率 / 增长率）
- 估值倍数（PE / PB / PS / 股息率）、跨标的 / 跨指数对比
- 宏观经济指标、行业指标（自然语言查询）
- 上市公司公告 / 定期报告 / 年报 / 招股书 / 监管文件
- 财经新闻摘要、研报片段（语义检索）

**❌ 不触发场景：**
- 实时行情、K 线、分钟级数据、板块成分 → 请用 `wind-quote-skill`
- 美股 / 欧股 / 非中概股 → 不支持
- 汇率 / 期货盘口 / 加密货币 → 不支持
- 非金融数据 → 不触发

## 工作流程（3 步）

所有命令以 `node ~/.claude/skills/wind-financial-data-skill/scripts/cli.mjs` 为前缀。

### Step 1：列出可用工具

```bash
node ~/.claude/skills/wind-financial-data-skill/scripts/cli.mjs list-tools
```

返回本 server 的全部工具（`search_financial_data` / `get_financial_documents`），含完整 `inputSchema`。

### Step 2：选工具 + 构造参数

根据用户问题和工具描述，选最合适的工具，按 `inputSchema` 构造参数：

| 用户意图 | 推荐工具 | 主参数 |
|---|---|---|
| 查具体**数值/指标**（财报、宏观、估值、增长率、跨标的对比）| `search_financial_data` | `question`（自然语言）|
| 查**文档片段**（新闻、研报、公告、年报、招股书）| `get_financial_documents` | `query`（自然语言）+ 可选 `docType`（1=新闻 / 3=公告 等）|

### Step 3：调用

```bash
node ~/.claude/skills/wind-financial-data-skill/scripts/cli.mjs call <tool_name> '<params_json>'
```

## 典型示例

**用例 A：数值查询 — "贵州茅台 2024 年营收"**

```bash
node ~/.claude/skills/wind-financial-data-skill/scripts/cli.mjs call \
  search_financial_data \
  '{"question":"贵州茅台 2024 年营业收入"}'
# → 结构化数值（营收金额）
```

**用例 B：文档检索 — "贵州茅台 2024 年报关于产能扩张的论述"**

```bash
node ~/.claude/skills/wind-financial-data-skill/scripts/cli.mjs call \
  get_financial_documents \
  '{"query":"贵州茅台 2024 年报 产能扩张","docType":"3","top_k":5}'
# → 公告类文档片段
```

> 实际参数以 `list-tools` 返回的 `inputSchema` 为准（`docType`：1=新闻 / 2=研报 / 3=公告 / ...）。

## API Key 配置

### 询问式获取流程（**Key 缺失时必须遵循**）

当用户的请求需要本 skill，但 cli.mjs 报 `❌ WIND_API_KEY 未配置`时：

1. **先询问用户**，类似："你还没配置万得 API Key。要我现在帮你打开开发者中心拿 Key 吗？"
2. **用户同意** → 跑 `open-portal` 子命令：
   ```bash
   node ~/.claude/skills/wind-financial-data-skill/scripts/cli.mjs open-portal
   ```
   命令返回 JSON，里面：
   - `url` 字段是要访问的链接（已登录直达 overview，未登录 SPA 会自动跳到 `/#/login`）
   - `fallback_message` 给用户看一句兜底文案（headless / 远程环境 spawn 失败时尤其重要）
3. **用户拒绝** → 直接告诉用户访问：`https://aimarket.wind.com.cn/#/user/overview`，登录后自行获取 Key
4. 用户拿到 Key 后，引导他选下面三种配置方式之一：

```bash
# A. 环境变量
export WIND_API_KEY=ak_xxx

# B. 本 skill 目录 config.json（仅本 skill 用）
echo '{"wind_api_key":"ak_xxx"}' > ~/.claude/skills/wind-financial-data-skill/config.json

# C. 全局 config（推荐：所有 wind 系列 skill 共享一份）
mkdir -p ~/.wind-aimarket && echo "WIND_API_KEY=ak_xxx" > ~/.wind-aimarket/config
```

> 三级兜底优先级：`env > skill 目录 config.json > 全局 config`

## 常见错误

| 错误 | 处理 |
|---|---|
| `WIND_API_KEY 未配置` | 走上面**询问式获取流程**：先问用户 → 跑 `open-portal` → 引导配置 |
| `MCP 调用失败 HTTP 401 / 403` | Key 无效 → 跑 `open-portal` 让用户去开发者中心重新生成 |
| `MCP 调用失败 HTTP 5xx` | 服务端异常 → 稍后重试或查 status.wind.com.cn |
| `tool not found` | 工具名拼写错误，先跑 `list-tools` 确认 |
| `params JSON 解析失败` | 注意 JSON 转义（双引号、中文需 UTF-8）|

## 数据来源标注

**向用户呈现结果时必须附注：** `数据来源于 Wind 万得金融终端`。

## 自检（响应前）

- 用户问题是不是**数值指标 / 文档检索 类**（非实时行情、非美股、非汇率）？是 → 继续；否 → 不触发本 skill
- 是否已配 `WIND_API_KEY`？未配 → **询问用户后**跑 `open-portal`，不要不打招呼直接弹浏览器
- 结果是否标注数据来源？
