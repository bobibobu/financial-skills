# wind-skills

> Wind 万得金融数据合并桥接 skill · v1.1.0 · 6 server / 19 工具

仿同花顺 ifind 模式：单 skill 包多 MCP server，按 `server_type` 路由。覆盖 Wind 行情 / 基金 / 股票 / 金融文档 / 宏观经济 / 通用分析。

---

## 安装

```bash
# GitHub
npx skills add JsonCodeChina/wind-skills --skill wind-skills -g -y

# Gitee 镜像（国内）
npx skills add https://gitee.com/jsonCodeChina/wind-skills.git --skill wind-skills -g -y
```

需要 `WIND_API_KEY`（登录 https://aimarket.wind.com.cn 开发者中心获取）。

---

## 命令

```bash
# 看可用工具（任选一个 server_type）
node scripts/cli.mjs list-tools quote
node scripts/cli.mjs list-tools fund_data
node scripts/cli.mjs list-tools financial_docs
node scripts/cli.mjs list-tools stock_data
node scripts/cli.mjs list-tools economic_data
node scripts/cli.mjs list-tools analytics_data

# 调用工具
node scripts/cli.mjs call <server_type> <tool_name> '<params_json>'

# 没 Key 时打开开发者中心（先问用户再跑）
node scripts/cli.mjs open-portal
```

---

## 覆盖范围

| server_type | 工具数 | 说明 |
|---|---|---|
| `quote` | 3 | A 股 / 港股实时行情、K 线、分钟级 |
| `fund_data` | 6 | 基金档案 / 财务 / 持仓 / 业绩 / 持有人 / 公司 |
| `financial_docs` | 2 | 公司公告、财经新闻（RAG 检索） |
| `stock_data` | 6 | 股票档案 / 财务基本面 / 股本 / 事件 / 技术指标 / 风险 |
| `economic_data` | 1 | EDB 宏观 / 行业经济指标 |
| `analytics_data` | 1 | 通用 NL → Wind 数据（fallback） |

未来扩展：直接在 cli.mjs 的 `SERVERS` map 加一行即可。

---

## API Key 三级兜底

1. `export WIND_API_KEY=ak_xxx`
2. `echo '{"wind_api_key":"ak_xxx"}' > config.json`（skill 目录下）
3. `mkdir -p ~/.wind-aimarket && echo "WIND_API_KEY=ak_xxx" > ~/.wind-aimarket/config`（全局，所有 wind skill 共享）

推荐方式 3。

---

## 升级

```bash
npx skills update -g -y
```
