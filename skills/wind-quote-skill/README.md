# wind-quote-skill

> **Wind 万得行情查询 Claude Skill** · 1:1 封装 `vserver_wind_quote` MCP server

---

## ✨ 特性

- **专题单一职责**：只做行情，不混财务/研报/其他
- **极简骨架**：2 个命令（`list-tools` + `call`），一份 SKILL.md
- **零依赖**：Node.js 18+ 原生 `fetch`
- **三级认证**：环境变量 / skill config / 全局 config（推荐全局，wind 系列 skill 共享）

---

## 🚀 安装

本 skill 已收录在 monorepo [`JsonCodeChina/wind-skills`](https://github.com/JsonCodeChina/wind-skills) 中。

### 方式 1：AI 帮你装（Claude Code 推荐）

在 Claude 里说："我要查 A 股行情"。AI 会在当前会话执行：

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-quote-skill -g -y
```

### 方式 2：手动

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-quote-skill -g -y
```

### 配置 API Key

**推荐全局配置**（所有 wind 系列 skill 共享）：

```bash
mkdir -p ~/.wind-aimarket && echo "WIND_API_KEY=ak_xxx" > ~/.wind-aimarket/config
```

**获取 Key：** [aimarket.wind.com.cn](https://aimarket.wind.com.cn) → 登录 → 开发者中心

---

## 🧪 手动测试

```bash
# 1. 列出工具
node ~/.claude/skills/wind-quote-skill/scripts/cli.mjs list-tools

# 2. 调用：查贵州茅台最新价
node ~/.claude/skills/wind-quote-skill/scripts/cli.mjs call quote_get_indicators \
  '{"windcode":"600519.SH","indexes":"NAME,MATCH,CHANGERANGE"}'
```

---

## 📦 目录结构

```
wind-quote-skill/
├── SKILL.md              # Claude 加载的核心指令
├── scripts/
│   └── cli.mjs           # 2 命令主脚本
├── config.json.example   # API Key 模板
├── .gitignore
└── README.md
```

**不包含：** catalog / list-servers / 多 server 发现 —— 这些是 `wind-find-skills`（未来）的职责。

---

## 🔧 能力范围

| 工具 | 功能 |
|---|---|
| `quote_get_indicators` | 实时行情快照（最新价、开盘、涨跌、成交）|
| `quote_get_kline` | K 线（日 / 周 / 月，前后复权）|
| `quote_get_minute` | 分钟级行情 |
| `quote_sector_get_members_sorted` | 万得板块成分证券 |

**不含：** 财务数据 / 公司公告 / 研报 → 请用 `wind-financial-data-skill`（规划中）

---

## 🔄 升级

重新跑一次安装命令即可（幂等）：

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-quote-skill -g -y
```

---

## 📝 许可

© Wind AIMarket 2026
