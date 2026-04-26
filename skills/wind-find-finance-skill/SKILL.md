---
name: wind-find-finance-skill
description: >-
  Wind AIMarket 金融能力入口 skill（meta-skill / llm-wiki router）。当用户问金融数据、金融文档、金融工具推荐、"该用哪个 skill"、或只安装了入口 skill 但希望继续解决金融问题时，先触发本 skill。它不调用 MCP server、不需要 API Key，只读 Wind AIMarket llm-wiki，输出目标金融 skill、安装命令、支持边界和下一步文档。覆盖 A 股 / 港股行情、财务、估值、基本资料、ESG、中国宏观、指数间接能力；对债券、可转债、基金、期权、期货、外汇、权证、美股、加密货币等未开放方向要诚实告知暂未收录。不要在用户已明确指定具体已安装 skill 时抢占调用。
version: 0.2.0
author: Wind AIMarket
homepage: https://aimarket.wind.com.cn
---

# Wind AIMarket 金融能力发现器

本 skill 是 **meta-skill**：自身不调底层 MCP server，只读内嵌的 llm-wiki 文档库（`references/wiki/`），帮 AI 在用户提金融问题时**命中对路的金融 skill**，并决定是安装 / 调用目标 skill，还是诚实告知当前暂未开放。

## 何时使用

**✅ 触发场景：**

- 用户问"**有什么金融能力 / 推荐工具 / 我想查 X 该用什么**"
- 用户提了具体金融问题（行情 / 财务 / 估值 / 宏观 / 公告），但当前上下文只装了入口 skill，或 AI **不确定用哪个 skill**
- 用户问到 wind 自家**未开放**的方向（美股 / 期货 / 外汇 / 加密货币 / 债券 / 基金 / 期权 / 权证）—— 需要诚实告知"暂未收录"

**❌ 不触发场景：**

- 用户已明确说要用某个具体 skill（"用 wind-quote-skill 查茅台"）→ 直接走那个 skill
- 非金融问题
- 已经装好且已明确对应 skill 的具体调用诉求 → 直接调那个 skill

## 工作流程（首选 route）

> 所有命令在 skill 目录下运行（cwd = skill 根）。

### Step 1：对用户原始问题做路由

```bash
node scripts/cli.mjs route "<用户原始问题>"
```

`route` 返回：

- `route_status`: `supported` / `partially_supported` / `not_available` / `catalog` / `needs_review`
- `recommended_skills`: 目标 skill、安装命令和摘要
- `read_docs`: 需要继续读取的 llm-wiki 文档
- `next_steps`: agent 下一步动作

### Step 2：读取 route 返回的文档

```bash
node scripts/cli.mjs read-doc <path>
```

`<path>` 是 Step 2 返回的相对路径（如 `categories/股票/行情.md`）。`read-doc` 自动远程优先 + 24h 缓存 + 本地基线兜底，保证拿到最新 wiki 内容。

### Step 3：安装 / 调用 / 告知边界

- `supported`：如果目标 skill 已安装，直接按目标 skill 的 SKILL.md 继续解决用户问题；如果未安装，运行或给出 `recommended_skills[].command`
- `partially_supported`：说明覆盖范围，再安装 / 调用目标 skill
- `not_available`：读取 `skills/_coming_soon.md` 或对应 placeholder 后，告诉用户当前暂未开放，不要套用不匹配的 skill
- `catalog`：读取 `index.md`，汇总已开放 skill、入口安装命令和待开放方向
- `needs_review`：读取 `index.md` 后人工判断；仍无法确认时说清楚当前能力清单未直接命中

## 典型示例

**用例 A：用户问"贵州茅台最新价多少"**

```bash
node scripts/cli.mjs route "贵州茅台最新价多少"
# → route_status=supported
# → recommended_skills[0].skill=wind-quote-skill
# → recommended_skills[0].command="npx skills add JsonCodeChina/wind-skills --skill wind-quote-skill -g -y"
# → read_docs=["skills/wind-quote-skill.md"]

node scripts/cli.mjs read-doc skills/wind-quote-skill.md
```

如果 `wind-quote-skill` 未安装，先安装；如果已安装，直接用它查询并回答。

**用例 B：用户问"美股 Tesla 当前股价"**

```bash
node scripts/cli.mjs route "美股 Tesla 当前股价"
# → route_status=not_available
# → read_docs=["skills/_coming_soon.md"]

node scripts/cli.mjs read-doc skills/_coming_soon.md
```

答复用户：Wind AIMarket 当前暂未开放美股行情能力 skill；不要编造数据，不要把 A 股 / 港股 skill 套上去。

**用例 C：用户问"有什么金融能力可用"**

```bash
node scripts/cli.mjs route "有什么金融 skill 可用"
# → route_status=catalog
# → read_docs=["index.md"]

node scripts/cli.mjs read-doc index.md
```

给用户列已开放 skill、入口安装命令、待开放方向。

## 低层命令

如果你需要调试匹配过程，可以使用：

```bash
node scripts/cli.mjs list-capabilities
node scripts/cli.mjs find-capability "<用户问题关键词>"
```

## 强制刷新 wiki 缓存

```bash
node scripts/cli.mjs refresh-wiki
```

强制从 GitHub 拉最新 wiki 全量到本地缓存。**正常使用不需要主动刷**（每个 read-doc 自带 24h 缓存逻辑），仅在以下场景使用：

- 用户报告"看到旧的 skill 推荐"
- 平台刚发新 skill / 新 category，想立即生效

## 数据来源标注

本 skill 推荐结果来自 Wind AIMarket llm-wiki（内嵌 + GitHub raw 远程同步）。给用户答复时**应附注**："以上推荐基于 Wind AIMarket 当前已开放能力清单"。

## 自检（响应前）

- 用户问题是不是**金融领域 + 需要选择 / 安装 / 判断 skill**？是 → 触发本 skill
- 是否先运行 `route` 并读了 `read_docs`？没走 → 别凭印象推荐
- 推荐的 skill 是不是 wiki "已开放 Skills" 里实际有的？不是 → 不要推荐
- 用户诉求超出已开放范围 → **诚实告知**，不要把别的 skill 套上去
