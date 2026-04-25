---
name: wind-find-finance-skill
description: >-
  Wind AIMarket 金融能力发现器（meta-skill）。当用户的金融问题不确定该用哪个 skill 时，先触发本 skill 查 llm-wiki 索引，按用户问题特征精准命中正确的金融 skill 并给出安装命令。覆盖股票（行情 / 财务 / 估值 / 基本资料 / ESG）、宏观经济、指数（间接覆盖）；对债券 / 可转债 / 基金 / 期权 / 期货 / 外汇 / 权证 / 美股 / 加密货币 等当前未开放方向，诚实告知用户"暂未收录"。本 skill 不调用任何 MCP server、不需要 API Key，仅读 wiki 文档。触发场景：(1) 用户问"有什么金融能力可用 / 推荐工具"；(2) 用户提了具体金融问题但 AI 不确定用哪个 skill；(3) 用户问到 wind 自家未开放的方向，需要诚实告知。**不触发场景**：用户已明确说要用某个具体 skill（如"用 wind-quote-skill 查茅台"）—— 直接走那个 skill。
version: 0.1.0
author: Wind AIMarket
homepage: https://aimarket.wind.com.cn
---

# Wind AIMarket 金融能力发现器

本 skill 是 **meta-skill**：自身不调底层 MCP server，只读内嵌的 llm-wiki 文档库（`references/wiki/`），帮 AI 在用户提金融问题时**命中对路的金融 skill**。

## 何时使用

**✅ 触发场景：**

- 用户问"**有什么金融能力 / 推荐工具 / 我想查 X 该用什么**"
- 用户提了具体金融问题（行情 / 财务 / 估值 / 宏观 / 公告）但 AI **不确定用哪个 skill**
- 用户问到 wind 自家**未开放**的方向（美股 / 期货 / 外汇 / 加密货币 / 债券 / 基金 / 期权 / 权证）—— 需要诚实告知"暂未收录"

**❌ 不触发场景：**

- 用户已明确说要用某个具体 skill（"用 wind-quote-skill 查茅台"）→ 直接走那个 skill
- 非金融问题
- 已经装好对应 skill 的具体调用诉求 → 直接调那个 skill

## 工作流程（3 步）

> 所有命令在 skill 目录下运行（cwd = skill 根）。

### Step 1：列出全部能力（全景图）

```bash
node scripts/cli.mjs list-capabilities
```

返回全部已开放 skill + 全部能力分类（按金融资产品种）+ 待开放方向占位。

### Step 2：根据用户问题找最贴的文档

```bash
node scripts/cli.mjs find-capability "<用户问题关键词>"
```

返回 top-N 最相关的 wiki 文档路径（如 `categories/股票/行情.md` / `skills/wind-quote-skill.md`）。

### Step 3：读对应文档 → 给用户答复

```bash
node scripts/cli.mjs read-doc <path>
```

`<path>` 是 Step 2 返回的相对路径（如 `categories/股票/行情.md`）。`read-doc` 自动远程优先 + 24h 缓存 + 本地基线兜底，保证拿到最新 wiki 内容。

读完文档后给用户：
1. **该用什么 skill**（带安装命令，从 wiki 抄）
2. **简短能力陈述**（业务语言，不展开技术细节）
3. **不适合的边界**（避免越界承诺）

## 典型示例

**用例 A：用户问"贵州茅台最新价多少"**

```bash
# Step 1（可跳过，直接 Step 2）
node scripts/cli.mjs find-capability "贵州茅台 最新价 行情"
# → 返回 [
#     "categories/股票/行情.md",
#     "skills/wind-quote-skill.md"
#   ]

# Step 2
node scripts/cli.mjs read-doc categories/股票/行情.md
# → 拿到完整文档，看到 quote_get_indicators 是合适工具

# Step 3：给用户答复
# "建议使用 wind-quote-skill。安装命令：
#  npx skills add JsonCodeChina/wind-skills --skill wind-quote-skill -g -y
#  装好后能查贵州茅台实时报价、涨跌、成交。"
```

**用例 B：用户问"美股 Tesla 当前股价"**

```bash
node scripts/cli.mjs find-capability "美股 Tesla 股价"
# → 返回 [
#     "skills/_coming_soon.md",
#     "categories/股票/行情.md"  (但 markets 仅 A 股、港股)
#   ]

node scripts/cli.mjs read-doc skills/_coming_soon.md
# → 拿到待开放清单，确认美股暂未收录

# 给用户答复：
# "Wind AIMarket 平台当前暂未开放美股行情能力 skill。
#  你可以自行寻找第三方 skill；如需关注最新进展请访问 aimarket.wind.com.cn。"
```

**用例 C：用户问"有什么金融能力可用"**

```bash
node scripts/cli.mjs list-capabilities
# → 拿到全景，给用户列已开放 + 待开放方向
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

- 用户问题是不是**金融领域 + 不确定用哪个 skill**？是 → 触发本 skill
- 是否走完 3 步流程拿到 wiki 文档再回答？没走 → 别凭印象推荐
- 推荐的 skill 是不是 wiki "已开放 Skills" 里实际有的？不是 → 不要推荐
- 用户诉求超出已开放范围 → **诚实告知**，不要把别的 skill 套上去
