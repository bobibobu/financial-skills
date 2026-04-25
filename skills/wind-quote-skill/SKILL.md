---
name: wind-quote-skill
description: >-
  Wind 万得行情查询。中国 A 股 / 港股股票的实时行情快照（最新价、前收、开盘、最高、最低、涨跌、成交量、成交额），K 线（日 / 周 / 月，前复权 / 后复权 / 不复权），分钟级行情，万得板块成分（行业 / 概念 / 主题 / 风格）。需要 WIND_API_KEY（登录 aimarket.wind.com.cn 开发者中心获取）。触发场景：股票代码查询最新价 / 涨跌幅 / 成交、K 线走势、分钟级数据、万得板块成员列表。**不包含**：财务数据（请用 wind-financial-data-skill）、美股 / 欧股 / 日股行情、汇率、期货盘口、非金融数据。
version: 0.3.0
author: Wind AIMarket
homepage: https://aimarket.wind.com.cn
---

# Wind 万得行情查询

本 skill 专注万得行情数据（对应 MCP server：`vserver_wind_quote`）。单一职责，零冗余。

## 何时使用

**✅ 触发场景：**
- A 股 / 港股股票最新行情（最新价、涨跌、成交）
- K 线（日 / 周 / 月 / 前复权 / 后复权）
- 分钟级行情
- 万得板块（行业 / 概念 / 主题 / 风格）成分证券

**❌ 不触发场景：**
- 公司财务、股东、公告 → 请用 `wind-financial-data-skill`
- 美股 / 欧股 / 非中概股 → 不支持
- 汇率 / 期货盘口 / 加密货币 → 不支持
- 非金融数据 → 不触发

## 工作流程（3 步）

> **所有命令在 skill 目录下运行**（AI 调用 Bash 工具时，cwd 自动就是 skill 根目录），路径用相对形式 `scripts/cli.mjs`。

### Step 1：列出可用工具

```bash
node scripts/cli.mjs list-tools
```

返回本 server 的全部工具（`quote_get_indicators` / `quote_get_kline` / `quote_get_minute` / `quote_sector_get_members_sorted`），含完整 `inputSchema`。

### Step 2：选工具 + 构造参数

根据用户问题和工具描述，选最合适的工具，按 `inputSchema` 构造参数。

### Step 3：调用

```bash
node scripts/cli.mjs call <tool_name> '<params_json>'
```

## 典型示例

**用户："帮我查贵州茅台最新价"**

```bash
# Step 1
node scripts/cli.mjs list-tools
# → 4 个工具全景

# Step 3（跳过 Step 2 因为行情快照明显用 quote_get_indicators）
node scripts/cli.mjs call \
  quote_get_indicators \
  '{"windcode":"600519.SH","indexes":"NAME,MATCH,PRECLOSE,OPEN,HIGH,LOW,CHANGE,CHANGERANGE,VOLUME,TURNOVER,TRADINGDATE,TIME"}'
# → 真实行情
```

## API Key 配置

### 询问式获取流程（**Key 缺失时必须遵循**）

当用户的请求需要本 skill，但 cli.mjs 报 `❌ WIND_API_KEY 未配置`时：

1. **先询问用户**，类似："你还没配置万得 API Key。要我现在帮你打开开发者中心拿 Key 吗？"
2. **用户同意** → 跑 `open-portal` 子命令：
   ```bash
   node scripts/cli.mjs open-portal
   ```
   命令返回 JSON，里面：
   - `url` 字段是要访问的链接（已登录直达 overview，未登录 SPA 会自动跳到 `/#/login`）
   - `fallback_message` 给用户看一句兜底文案（headless / 远程环境 spawn 失败时尤其重要）
3. **用户拒绝** → 直接告诉用户访问：`https://aimarket.wind.com.cn/#/user/overview`，登录后自行获取 Key
4. 用户拿到 Key 后，引导他选下面三种配置方式之一：

```bash
# A. 环境变量
export WIND_API_KEY=ak_xxx

# B. 本 skill 目录 config.json（仅本 skill 用，路径相对 skill 根）
echo '{"wind_api_key":"ak_xxx"}' > config.json

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

- 用户问题是不是**行情类**（非财务、非美股、非汇率）？是 → 继续；否 → 不触发本 skill
- 是否已配 `WIND_API_KEY`？未配 → **询问用户后**跑 `open-portal`，不要不打招呼直接弹浏览器
- 结果是否标注数据来源？
