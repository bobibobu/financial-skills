---
type: category
asset: 指数
coverage: partial
recommended_skills: [wind-quote-skill, wind-financial-data-skill]
gaps:
  - 完整指数行情 / 成分 skill 待开放
  - 当前通过 wind-quote-skill 的 sector 接口 + wind-financial-data-skill 的自然语言查询间接覆盖
---

# 指数 · 间接覆盖

## 当前状态

**coverage: partial** — Wind AIMarket 平台**暂无专门的指数 skill**，但通过现有两个 skill 间接覆盖部分指数能力：

| 间接能力 | 用 skill | 调用 |
|---|---|---|
| 万得指数 / 板块成分 | wind-quote-skill | `quote_sector_get_members_sorted` |
| 指数估值 / 收益率 / 跨指数对比 | wind-financial-data-skill | `search_financial_data` |
| 指数 K 线（沪深 300 / 中证 500 等主流指数）| wind-quote-skill | `quote_get_kline`（实测确认中）|

## AI 应对话术

用户问指数问题时：

- **板块成分**：直接用 `quote_sector_get_members_sorted`
- **跨指数估值 / 收益率对比**：用 `search_financial_data`
- 遇到**完整指数详情**（编制方案 / 调样规则 / 历史样本变更）等深度需求 → 诚实告知"暂未开放"
- 引导关注 [_coming_soon.md](../../skills/_coming_soon.md)
