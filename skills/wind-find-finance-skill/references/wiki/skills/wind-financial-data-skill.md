---
type: skill
name: wind-financial-data-skill
vendor: wind
markets: [A股, 港股]
mcp_server: vserver_wind_financial_data
install: "npx skills add JsonCodeChina/wind-skills --skill wind-financial-data-skill -g -y"
status: stable
version: "0.2.0"
summary: "Wind 万得金融基本面数值（财务/估值/宏观）+ 公司文档（新闻 + 公告）的智能查询。"
business:
  stage: beta
  current_model: credit_daily_reset
  current_notes: |
    内测期免费使用，每日赠送积分，次日 0:00 清零。
    每次调用消耗积分（额度待定）。
  future_models:
    - by_call:
        unit_price: TBD
        target_audience: 个人 / 平台
    - monthly_plan:
        price: TBD
        included_calls: TBD
    - b_tier_license:
        base_fee: TBD
        l1_l4_packages: 见 pricing_doc
  pricing_doc: https://aimarket.wind.com.cn/
---

# wind-financial-data-skill · AI 档案

> 1:1 包装 `vserver_wind_financial_data` MCP server。两个工具：智能查询结构化数值 + 金融文档检索。当前主力市场为 A 股 / 港股 / 国内宏观；description 中提及的跨境标的（如苹果、特斯拉）以实测为准。

## 工具一览

| 工具 | 能力性质 | T 层级 | 一句话 |
|---|---|---|---|
| [`search_financial_data`](#search_financial_data--t3-智能查询) | 智能查询 | T3 | 自然语言查结构化数值（财报 / 估值 / 跨标的对比 / 宏观）|
| [`get_financial_documents`](#get_financial_documents--t3-金融文档检索) | 金融文档检索 | T3 | 自然语言查文档片段（新闻 + 公告，公告含年报 / 招股书等子类）|

---

## search_financial_data · T3 智能查询

```yaml
tool_name: search_financial_data
capability_type: 智能查询
d_score: {d1: 3, d2: 1, d3: 2, d4: 2}
t_tier: T3
mcp_server: vserver_wind_financial_data
```

### A. 它能做什么（来自工具描述）

> 通过自然语言查询检索结构化金融数据。覆盖股票、基金、ETF、宏观经济指标、指数及公司财务数据（如营收、利润、资产负债表科目等）。支持计算类指标，包括财务比率、增长率、涨跌幅以及跨指数对比。当用户需要查询数值型或定量金融信息时使用此工具，例如价格、收益率、估值倍数、经济指标或基于这些数据的衍生计算。查询示例："苹果2024年营收"、"沪深300与中证500年初至今收益率对比"、"特斯拉近5年市盈率"。

**主参数：** `question`（必填，自然语言）/ `lang`（中文 默认 / English）。

### B. 实测边界（资深金融从业者视角，MVP 快速版）

| # | 测试输入 | 实际行为 | 结论 |
|---|---|---|---|
| 1 | "贵州茅台 2024 年营业收入" | 返回结构化数值 | 符合 description |
| 2 | "沪深 300 与中证 500 近 1 年涨跌对比" | 返回时间序列 + 对比表 | 符合 description（计算类指标）|
| 3 | "贵州茅台最近 30 天日级收盘价" | 返回日级价格序列 | **超出** description 主述（"基本面/估值"），实际能查日级股价时序——但纯 K 线 / 实时报价仍引导 wind-quote-skill |
| 4 | "苹果 2024 年营收" | 返回结果，但跨境数据需逐题验证 | description 提及跨境例子（苹果/特斯拉），实际主力是 A 股 + 港股 + 国内宏观；跨境数据准确性以实测为准 |

> 完整 ~15 用例实测进 `_sop.md` 后续轮次，本 sample 留 4 用例代表 description 覆盖 / 越界 / 跨境边界三种典型情况。

### C. 它的特点（业务语言）

- 你**不需要拼参数、不需要懂 Wind 代码**，自然语言一句话拿结构化财报 / 估值 / 宏观数值。
- **自动算**财务比率、增长率、跨标的对比——例如"沪深 300 vs 中证 500 ROE 中位数"，不用自己拉数据再算。
- 适合**模糊提问**或**衍生计算**场景；如果要的是确定性 100% 的实时报价，请用 `wind-quote-skill`。
- 模型解析有理解风险，给用户陈述结果时建议复述查询理解（"我把您的问题理解为 …"），便于复核。

### D. 典型用法（来自工具描述示例）

- "苹果2024年营收"
- "沪深300与中证500年初至今收益率对比"
- "特斯拉近5年市盈率"

### E. 适合 / 不适合

**适合：** 财报科目 / 估值倍数 / 增长率 / 跨标的对比 / 宏观指标的**自然语言查询**。
**不适合：**
- 实时报价 / K 线 / 分钟行情 → [wind-quote-skill](./wind-quote-skill.md)
- 公告 / 年报 / 招股书 / 新闻 → 用本 skill 的 `get_financial_documents`
- 美股 / 欧股 / 加密货币 → 暂无收录（参见 `../_coming_soon.md`）

### F. 计费层级

**T3**（max=3 / 总分=8）。内测期免费使用（每日积分送，次日清零）。正式期按 T3 档计费，详见 [aimarket.wind.com.cn](https://aimarket.wind.com.cn/) 开发者中心。

---

## get_financial_documents · T3 金融文档检索

```yaml
tool_name: get_financial_documents
capability_type: 金融文档检索
d_score: {d1: 1, d2: 1, d3: 3, d4: 2}
t_tier: T3
mcp_server: vserver_wind_financial_data
```

### A. 它能做什么（来自工具描述）

> 通过自然语言查询获取财经新闻报道及公司公告文档（如业绩公告、监管文件、致股东信、招股说明书等）。当用户询问近期事件、新闻资讯、企业信息披露或与金融实体相关的官方文件时使用此工具。返回文档内容或摘要，而非结构化数值数据。查询示例："特斯拉最新财报公告"、"美联储利率决议相关新闻"、"阿里巴巴2024年年报"。

**主参数：** `query`（必填，自然语言）/ `docType`（**实测 enum_map 仅 `"1"`=新闻 默认 / `"3"`=公告**两个有效值，多类型用逗号分隔如 `"1,3"`）/ `top_k`（1-20，默认 5）/ `start_date` / `end_date`（YYYY-MM-DD）。

### B. 实测边界（资深金融从业者视角，MVP 快速版）

| # | 测试输入 | 实际行为 | 结论 |
|---|---|---|---|
| 1 | `query="贵州茅台 2025 年报", docType="3"` | 返回相关公告片段（年报属公告子类）| 符合 description |
| 2 | `query="新能源车行业最近一周新闻", docType="1", top_k=10` | 返回新闻摘要列表 | 符合 description |
| 3 | `query="比亚迪电池业务", docType="1,3"` | 多类型混合返回（新闻 + 公告片段）| 多 docType 逗号分隔生效 |
| 4 | `query="特斯拉最新财报", start_date="2026-01-01"` | 时间窗口生效，返回限定区间内文档 | 符合 description |
| 5 | `docType="2"`（研报）/ `"4"`（3C）/ `"5"`（法规）等 | 不在有效 enum_map 内，**实测不可用** | **description 描述偏强**：description 文本列出 News(1)/Research Reports(2)/Announcements(3)/3C(4)/Laws(5)/Financial Knowledge(6)/... 等多类型，**实测 enum_map 仅暴露 `1`（新闻）和 `3`（公告）**。研报 / 法规 / 财经百科等当前不在该工具开放范围内 |

### C. 它的特点（业务语言）

- 一句话查**新闻 + 公告**两类官方文档；公告子类涵盖年报 / 招股书 / 监管文件 / 业绩预告 / 重大事项等（用查询语句自然描述，不需要二级分类参数）。
- 返回**文档片段或摘要**——这是给 AI 拿去做总结、引用、决策辅助的素材，不是直接数值。
- 用 `docType="1"`（新闻）/ `"3"`（公告）/ `"1,3"`（两者混合）精确过滤，配合 `top_k` 和日期窗口，能稳定收敛召回范围。
- 文档片段可能不完整，给用户陈述时应说明"以下是文档摘要片段"，需要全文请到 Wind 终端查阅原文。
- **不覆盖研报**——research_reports 不在该工具开放范围内，遇到"找研报"诉求请告知用户当前未开放。

### D. 典型用法（来自工具描述示例）

- "特斯拉最新财报公告"
- "美联储利率决议相关新闻"
- "阿里巴巴2024年年报"

### E. 适合 / 不适合

**适合：** **新闻 + 公告**（含年报 / 招股书 / 监管文件 / 业绩预告等"公告"子类）的**自然语言检索**，需要**文本素材**而非数值时。
**不适合：**
- 财务数值 / 估值倍数 → 同 skill 的 `search_financial_data`
- 实时报价 / K 线 → [wind-quote-skill](./wind-quote-skill.md)
- **研报 / 行业深度报告** → 当前不开放（`docType="2"` 不在 enum_map）
- 美股 / 全球新闻 → 当前以国内市场为主，跨境文档覆盖度不稳定

### F. 计费层级

**T3**（max=3 / 总分=7）。内测期免费使用（每日积分送，次日清零）。正式期按 T3 档计费，详见 [aimarket.wind.com.cn](https://aimarket.wind.com.cn/) 开发者中心。

---

## 安装与认证

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-financial-data-skill -g -y
```

需要 `WIND_API_KEY`（与其他 `wind-*` skill 共享同一份全局 config）。skill 装好后未配置 Key 会主动引导：

```bash
node <skill-dir>/scripts/cli.mjs open-portal
```

会打开 [aimarket.wind.com.cn](https://aimarket.wind.com.cn/) 开发者中心拿 Key。

## 跟其他 skill 的协作

- **股票 + 财务联合**："茅台是不是被低估" → `wind-quote-skill` 拿当前价 + 本 skill 拿 PE/PB → AI 综合判断
- **板块横评**：`wind-quote-skill` 拿"沪深 300 成分" → 本 skill 逐家查 ROE → AI 排序
- **公告联动**：本 skill 的 `search_financial_data` 拿数据 + `get_financial_documents` 拿同期新闻 / 公告，AI 给出有引用的解读

## 数据来源

万得金融终端（Wind Financial Terminal）。AI 向用户呈现结果时**必须附注：数据来源于 Wind 万得金融终端**。
