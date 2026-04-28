# wind-skills

> Wind 万得金融数据合并桥接 skill · 行情 + 基本面 + RAG 一站到位

合并自 `wind-quote-skill` v0.3.0 + `wind-financial-data-skill` v0.2.0，仿同花顺 ifind 模式：单 skill 包多 MCP server，按 `server_type` 路由。

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
# 看可用工具
node scripts/cli.mjs list-tools quote
node scripts/cli.mjs list-tools financial-data

# 调用工具
node scripts/cli.mjs call <server_type> <tool_name> '<params_json>'

# 没 Key 时打开开发者中心（先问用户再跑）
node scripts/cli.mjs open-portal
```

---

## 覆盖范围

| server_type | 工具数 | 说明 |
|---|---|---|
| `quote` | 4 | 实时行情、K 线、分钟级、板块成分 |
| `financial-data` | 2 | 财报数值（自然语言）、金融文档（语义检索） |

未来扩展：`esg` / `alternative` / `trading` / ... 直接在 cli.mjs 的 `SERVERS` map 加一行。

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
