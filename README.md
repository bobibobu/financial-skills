# wind-skills

> **Wind 万得金融 Skill 集合（monorepo）** · 通过 MCP 协议把万得金融数据接入 Claude / OpenClaw / Hermes 等 AI Agent

[![GitHub](https://img.shields.io/badge/GitHub-JsonCodeChina%2Fwind--skills-blue?logo=github)](https://github.com/JsonCodeChina/wind-skills)

---

## 📦 收录的 Skill

| Skill | 能力域 | 状态 |
|---|---|---|
| [`wind-quote-skill`](./skills/wind-quote-skill) | 中国 A 股 / 港股**实时行情**、K 线、分钟级、万得板块成分 | ✅ v0.2.0 |
| [`wind-financial-data-skill`](./skills/wind-financial-data-skill) | **金融基本面数据**（财报、估值、宏观）+ **文档 RAG**（新闻 / 研报 / 公告 / 年报）| ✅ v0.1.0 |

> 所有 skill 1:1 封装一个 Wind MCP server，专题单一职责，互不重叠。

---

## 🚀 安装

### 装单个 skill（推荐）

```bash
# 行情
npx skills add JsonCodeChina/wind-skills --skill wind-quote-skill -g -y

# 财务数据 + 文档检索
npx skills add JsonCodeChina/wind-skills --skill wind-financial-data-skill -g -y
```

### 全部装上

```bash
npx skills add JsonCodeChina/wind-skills -g -y
```

### 列出仓库内所有可装 skill

```bash
npx skills add JsonCodeChina/wind-skills --list
```

> `-g` 装到所有已识别的 agent（Claude Code / Desktop / OpenClaw / Hermes 等）；`-y` 跳过交互菜单。

---

## 🔑 配置 API Key（一次配置，全系列共享）

### 让 AI 帮你打开开发者中心拿 Key（推荐）

装好 skill 后，第一次问行情 / 财务问题，AI 会发现没 Key 并**主动询问**："要我现在帮你打开万得开发者中心吗？" 同意后，AI 会运行：

```bash
node ~/.claude/skills/wind-quote-skill/scripts/cli.mjs open-portal
# 或
node ~/.claude/skills/wind-financial-data-skill/scripts/cli.mjs open-portal
```

跨平台自动调浏览器（macOS `open` / Linux `xdg-open` / Windows `start`），打开 `https://aimarket.wind.com.cn/#/user/overview`：

- **已登录** → 直接看到个人中心，复制 API Key
- **未登录** → SPA 自动跳到 `/#/login`，登录后回到 overview 即可

> headless / 远程 SSH / 无 GUI 环境下 spawn 会失败，命令会输出 `fallback_message` 让你手动复制 URL。

### 拿到 Key 后配置

```bash
mkdir -p ~/.wind-aimarket && echo "WIND_API_KEY=ak_xxx" > ~/.wind-aimarket/config
```

### 三级兜底（按优先级）

1. 环境变量 `WIND_API_KEY`
2. skill 目录内 `config.json`
3. 全局 `~/.wind-aimarket/config`（**推荐**）

---

## 🧭 选哪个 skill？（边界守则）

| 你想问 | 用哪个 skill |
|---|---|
| 茅台**最新价**、今天涨跌、成交量 | `wind-quote-skill` |
| 茅台**K 线**走势（日 / 周 / 月） | `wind-quote-skill` |
| 沪深 300 / 中证 1000 等**板块成分** | `wind-quote-skill` |
| 茅台 2024 年**营收 / 净利润 / ROE** | `wind-financial-data-skill` |
| 茅台**最新公告 / 年报 / 研报** | `wind-financial-data-skill` |
| 跨指数 / 跨标的**财务对比** | `wind-financial-data-skill` |
| GDP / CPI / M2 等**宏观指标** | `wind-financial-data-skill` |

> 模糊场景（如"茅台走势"）：默认走 `wind-quote-skill`（K 线）；带"业绩 / 财务 / 估值"关键词时切到 `wind-financial-data-skill`。

---

## 📂 目录结构

```
wind-skills/
├── README.md                                ← 你现在看的这份
└── skills/
    ├── wind-quote-skill/
    │   ├── SKILL.md                         ← AI 加载的核心指令
    │   ├── scripts/cli.mjs                  ← 主脚本（list-tools + call）
    │   ├── README.md
    │   ├── config.json.example
    │   └── .gitignore
    └── wind-financial-data-skill/
        └── （同上结构）
```

---

## 🛠️ 兼容 Agent

经实测兼容（同一份 SKILL.md，零适配）：

- ✅ Claude Code / Claude Desktop
- ✅ OpenClaw
- ✅ Hermes Agent
- 🔄 其他遵循 [Anthropic Skill 规范](https://github.com/vercel-labs/skills) 的 agent 理论上可用

---

## 🗺️ 路线图

- [ ] `wind-find-finance-skill` —— 入口型 skill，含**金融能力发现器**（不限 wind 自家，未来收录第三方如同花顺 / 彭博等）
- [ ] 触发率回归测试集（50 条真实金融问句）

---

## 📝 许可

© Wind AIMarket 2026
