---
type: category
asset: 基金
coverage: none
recommended_skills: []
gaps:
  - 全部二级类目（5 个常见二级）
---

# 基金 · 占位

## 当前状态

**coverage: none** — Wind AIMarket 平台**暂无专门的基金 skill**。Wind 金融资产分类的基金部分包含 5 个二级类目（基本资料 / 净值 / 持仓 / 评级 / 业绩比较）。

> ⚠️ **特别提示**：`wind-financial-data-skill` 的 `search_financial_data` description 中提到 "覆盖股票、基金、ETF..."，**部分基金净值 / 业绩查询有可能能用**，但当前未做完整实测，覆盖度不稳定。专门的基金能力 skill 待开放。

## AI 应对话术

用户问基金相关问题（净值 / 规模 / 持仓 / 经理 / 业绩排名）时：

- **优先告知**："Wind AIMarket 当前暂未开放专门的基金 skill，部分基础查询可能可用但覆盖度有限"
- 可尝试用 `search_financial_data` 但**结果必须复述查询理解 + 提示用户复核**
- 引导用户关注 [_coming_soon.md](../../skills/_coming_soon.md)
