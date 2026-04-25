# wind-financial-data-skill

> **Wind 万得金融基本面数据 & RAG 检索 Claude Skill** · 1:1 封装 `vserver_wind_financial_data` MCP server

---

## ✨ 特性

- **专题单一职责**：只做金融数值 + 文档 RAG 检索，不混行情/其他
- **极简骨架**：2 个命令（`list-tools` + `call`），一份 SKILL.md
- **零依赖**：Node.js 18+ 原生 `fetch`
- **三级认证**：环境变量 / skill config / 全局 config（推荐全局，wind 系列 skill 共享）

---

## 🚀 安装

本 skill 已收录在 monorepo [`JsonCodeChina/wind-skills`](https://github.com/JsonCodeChina/wind-skills) 中。

### 方式 1：AI 帮你装（Claude Code 推荐）

在 Claude 里说："我要查 A 股财务数据"。AI 会在当前会话执行：

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-financial-data-skill -g -y
```

### 方式 2：手动

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-financial-data-skill -g -y
```

### 配置 API Key

**推荐全局配置**（所有 wind 系列 skill 共享）：

```bash
mkdir -p ~/.wind-aimarket && echo "WIND_API_KEY=ak_xxx" > ~/.wind-aimarket/config
```

**获取 Key：** [aimarket.wind.com.cn](https://aimarket.wind.com.cn) → 登录 → 开发者中心

---

## 🧪 手动测试

> 假设你已经 `cd` 到 skill 目录（Claude Code: `~/.claude/skills/wind-financial-data-skill/`；其他 agent 路径可能不同，但脚本路径相对 skill 根都是 `scripts/cli.mjs`）。

```bash
# 1. 列出工具（看完整 inputSchema）
node scripts/cli.mjs list-tools

# 2. 数值查询示例
node scripts/cli.mjs call search_financial_data \
  '{"question":"贵州茅台 2024 年营业收入"}'

# 3. 文档检索示例
node scripts/cli.mjs call get_financial_documents \
  '{"query":"贵州茅台 2024 年报 产能扩张","docType":"3","top_k":5}'

# 4. 没有 API Key？打开开发者中心拿一个
node scripts/cli.mjs open-portal
```

> 实际参数以 `list-tools` 输出的 `inputSchema` 为准。

---

## 📦 目录结构

```
wind-financial-data-skill/
├── SKILL.md              # Claude 加载的核心指令
├── scripts/
│   └── cli.mjs           # 2 命令主脚本
├── config.json.example   # API Key 模板
├── .gitignore
└── README.md
```

---

## 🔧 能力范围

| 工具 | 功能 | 主参数 |
|---|---|---|
| `search_financial_data` | 自然语言查**结构化数值**（股票/基金/ETF/宏观、财报指标、估值倍数、增长率、跨指数对比）| `question` |
| `get_financial_documents` | 自然语言查**文档**（新闻 / 研报 / 公告 / 年报 / 招股书 / 监管文件，可按 `docType` 过滤）| `query` + 可选 `docType` `top_k` `start_date` `end_date` |

**不含：** 实时行情 / K 线 / 板块成分 → 请用 [`wind-quote-skill`](https://github.com/JsonCodeChina/wind-skills/tree/main/skills/wind-quote-skill)

---

## 🔄 升级

重新跑一次安装命令即可（幂等）：

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-financial-data-skill -g -y
```

---

## 📝 许可

© Wind AIMarket 2026
