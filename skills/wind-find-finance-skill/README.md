# wind-find-finance-skill

> **Wind AIMarket 金融能力入口（meta-skill）** · 读 llm-wiki，帮 AI 命中、安装或调用对路的金融 skill

---

## ✨ 这是什么

不是数据 skill，是**入口 skill / llm-wiki router**：

- 用户问金融问题 → AI 先用本 skill 查 wiki → 得到目标金融 skill、安装命令、支持边界和下一步文档
- 目标 skill 已安装 → AI 直接调用目标 skill 解决问题；未安装 → AI 给出或执行安装命令
- 用户问 Wind 自家未开放的方向（美股 / 期货 / 外汇等）→ 本 skill 让 AI 诚实告知"暂未收录"，不会让 AI 把别的 skill 套上去

---

## 🚀 安装

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-find-finance-skill -g -y
```

**不需要 API Key** —— 本 skill 只读 wiki 文档，不调任何 MCP server。

这也是推荐给用户的首装入口：先装本 skill，再由它按用户问题分流到 `wind-quote-skill` / `wind-financial-data-skill` 或未来第三方金融 skill。

---

## 🧪 手动测试

```bash
# 1. 推荐首选：对用户原始问题做路由
node scripts/cli.mjs route "贵州茅台 最新价"
# → 返回 route_status / recommended_skills / read_docs / next_steps

# 2. 列出全部已开放 skill + categories
node scripts/cli.mjs list-capabilities

# 3. 关键词找最贴的 wiki 文档（调试用）
node scripts/cli.mjs find-capability "贵州茅台 最新价"
# → 返回 [categories/股票/行情.md, skills/wind-quote-skill.md]

# 4. 读对应文档（远程优先 + 24h 缓存 + 本地兜底）
node scripts/cli.mjs read-doc categories/股票/行情.md

# 5. 强制刷新本地缓存（平台刚发新 skill 时用）
node scripts/cli.mjs refresh-wiki
```

---

## 📦 目录结构

```
wind-find-finance-skill/
├── SKILL.md                    # AI 加载的核心指令
├── scripts/
│   └── cli.mjs                 # 5 命令主脚本：route / list / find / read / refresh
├── references/
│   └── wiki/                   # llm-wiki 本地基线快照（远程拉失败时兜底）
│       ├── index.md
│       ├── _sop.md
│       ├── skills/             # 已开放 skill 工具档案
│       └── categories/         # 按金融资产品种的能力分类
├── .gitignore
└── README.md
```

---

## 🔄 wiki 远程同步机制

`read-doc` 命令的取数顺序：

1. **远程优先**（24h 内缓存命中跳过这步）：从 `https://raw.githubusercontent.com/JsonCodeChina/wind-skills/main/skills/wind-find-finance-skill/references/wiki/<path>` 拉
2. **写本地缓存**（`~/.cache/wind-aimarket/wiki/<path>`）
3. **远程失败 + 缓存过期** → 用过期缓存
4. **缓存不存在** → 用 skill 目录附带的本地基线（`references/wiki/<path>`）

**这意味着：**

- 平台改 wiki → push GitHub → 已装用户 24h 内自动拿新版
- 内网 / 断网 / 限速 → 本地基线兜底，永不失败
- 主动刷新：`node scripts/cli.mjs refresh-wiki`

---

## 🔧 工作原理

本 skill 是 **meta-skill**：

| 维度 | 数据 skill（如 wind-quote-skill）| 本 skill |
|---|---|---|
| 调底层 MCP server | ✅ | ❌ |
| 需要 WIND_API_KEY | ✅ | ❌ |
| 返回业务数据 | ✅ | ❌ |
| 返回 wiki 推荐路径 | ❌ | ✅ |
| 谁来调用 | AI 直接调（拿数据答用户）| AI 在不确定用哪个 skill 时先调（拿推荐）|

AI 在 SKILL.md 加载后会按首选流程走：`route` → `read-doc` → 安装或调用目标 skill → 给用户答复。

---

## 🔄 升级

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-find-finance-skill -g -y
```

幂等。本地基线随仓库更新；缓存通过 24h TTL 自动刷新。

---

## 📝 许可

© Wind AIMarket 2026
