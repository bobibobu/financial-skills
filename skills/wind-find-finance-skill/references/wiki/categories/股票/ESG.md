---
type: category
asset: 股票
sub: ESG
coverage: partial
recommended_skills: [wind-financial-data-skill]
gaps:
  - ESG 评分体系与子指标覆盖度待 SOP 实测确认
  - 历史评分序列覆盖度待 SOP 实测确认
---

# 股票 · ESG

## 范围

环境（E）/ 社会（S）/ 公司治理（G）三维度评分。资产分类标准包含 ESG 二级类目，但 wind-financial-data-skill 的 `search_financial_data` 实际能查到的 ESG 指标深度需通过完整实测确认。

## 当前状态

**coverage: partial** — 自然语言可问"贵州茅台 ESG 评分"，但具体返回字段（评分体系来源 / 子指标 / 历史序列覆盖度）需 SOP 实测补全。完整 ~15 用例实测进 [`_sop.md`](../../_sop.md) 后续轮次，结果回填本文件 gaps。

## 推荐 skill

| 用户场景 | 推荐 skill | 调用工具 |
|---|---|---|
| 单标的 ESG 评分查询 | [wind-financial-data-skill](../../skills/wind-financial-data-skill.md) | `search_financial_data`（实测确认中）|

## 典型用户问句

- "贵州茅台的 ESG 评分"
- "中证 ESG 100 成分股"
- "新能源板块 ESG 平均评分"

## 调用提示

- 当前未做完整实测，AI 在给用户结果时**应附注**："ESG 数据覆盖度由 wind-financial-data-skill 提供，具体指标体系以返回字段为准"
- 遇到细分诉求（如 SASB 重要性议题、TCFD 气候披露）超出当前覆盖时，诚实告知用户"暂无收录"
