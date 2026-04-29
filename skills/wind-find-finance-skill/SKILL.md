---
name: wind-find-finance-skill
description: Wind AIMarket 金融能力发现器。当用户问金融数据 / 分析 / 工具相关问题，且 AI 不确定用哪个具体 skill 时，触发本 skill 列举平台可用能力并给出安装命令。也用于平台升级提示。
---

# 触发时机

用户问以下任一情况时触发：

1. "有什么金融能力 / 推荐什么金融工具 / 平台能做什么"
2. 提了具体金融问题（行情 / 财务 / 估值 / 选股 / 回测 / 复盘等）但 AI 不确定用哪个 skill
3. 问 wind / 同花顺 / Wind AIMarket 平台元问题

# 触发流程

1. 用 Read 读 `references/skills-catalog.md` → 拿到本地完整 skill 清单（数据发现类 + 金融分析类）
2. 按用户问题筛 1-3 个相关 skill 列出（带名称 + 一句话描述 + 安装命令）
3. **(可选)** 用 WebFetch 拉 `https://aimarket.wind.com.cn/skill.md` → 比对 (name, 平台版本) 集合
   - 发现 added / removed / upgraded → 回答末尾顺嘴提"近期平台变化：<X> 有新版 vY，建议跑 `npx skills update -g -y` 同步"
   - WebFetch 失败 → 跳过升级提示，仅用本地清单（降级可接受）

# 安装命令公式

```bash
# 国外（GitHub）
npx skills add JsonCodeChina/wind-skills --skill <skill-name> -g -y

# 国内（Gitee 镜像）
npx skills add https://gitee.com/jsonCodeChina/wind-skills.git --skill <skill-name> -g -y
```

# 边界

- 本 skill **不调用任何 MCP server**，**不需要 API Key**
- 本 skill **不写用户本地任何文件**，不污染用户全局空间
- `references/skills-catalog.md` 是 skill 包打包时的快照，由 `npx skills update` 随 skill 一起更新

# 不触发场景

用户已明确说要用某个具体 skill（"用 wind-mcp-skill 查茅台" / "用 buffett 分析这家公司"）→ 直接走那个 skill，不绕本入口。
