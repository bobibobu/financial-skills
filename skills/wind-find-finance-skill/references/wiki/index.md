---
type: index
title: Wind AIMarket 金融能力索引
purpose: AI 在 wind-find-finance-skill 触发后第一篇阅读的导航文档
last_updated: 2026-04-25
version: v1
---

# Wind AIMarket 金融能力索引

> 本文档库面向 **AI 上下文消费**，不是给人读的产品文档。AI 装好 `wind-find-finance-skill` 后，遇到"用户想查的金融能力不确定用哪个 skill"时，**先 Read 本文件**，再按需深入下方链接。

## 已开放 Skills

| Skill | Vendor | 市场 | 主要能力 | 安装命令 |
|---|---|---|---|---|
| [wind-quote-skill](./skills/wind-quote-skill.md) | wind | A 股、港股 | 实时行情 / K 线 / 分钟级 / 板块成分 | `npx skills add JsonCodeChina/wind-skills --skill wind-quote-skill -g -y` |
| [wind-financial-data-skill](./skills/wind-financial-data-skill.md) | wind | A 股、港股 | 财务基本面 / 估值 / 宏观 / 公司文档（新闻 + 公告）| `npx skills add JsonCodeChina/wind-skills --skill wind-financial-data-skill -g -y` |

## 能力分类（按金融资产品种）

### 已开放

| 一级资产 | 二级类目 | 覆盖度 | 推荐 Skill |
|---|---|---|---|
| 股票 | [基本资料](./categories/股票/基本资料.md) | full | wind-quote-skill / wind-financial-data-skill |
| 股票 | [行情](./categories/股票/行情.md) | full | wind-quote-skill |
| 股票 | [估值指标](./categories/股票/估值指标.md) | full | wind-financial-data-skill |
| 股票 | [财务指标](./categories/股票/财务指标.md) | full | wind-financial-data-skill |
| 股票 | [ESG](./categories/股票/ESG.md) | partial | wind-financial-data-skill（实测确认中）|
| 宏观经济 | [宏观经济](./categories/宏观经济.md) | full | wind-financial-data-skill |
| 指数 | [指数（间接覆盖）](./categories/指数/README.md) | partial | wind-quote-skill / wind-financial-data-skill |

### 待开放（placeholder，coverage=none）

| 一级资产 | 占位文档 |
|---|---|
| 债券 | [债券](./categories/债券/README.md) |
| 可转债 | [可转债](./categories/可转债/README.md) |
| 基金 | [基金](./categories/基金/README.md) |
| 期权 | [期权](./categories/期权/README.md) |
| 期货 | [期货](./categories/期货/README.md) |
| 权证 | [权证](./categories/权证/README.md) |
| 外汇 | [外汇](./categories/外汇/README.md) |

完整待开放方向见 [`skills/_coming_soon.md`](./skills/_coming_soon.md)。

## 怎么用本文档库（AI 决策路径）

| 用户问题特征 | AI 应优先 Read |
|---|---|
| 提到具体股票名 / 代码、问"价格 / 涨跌 / K 线" | [`categories/股票/行情.md`](./categories/股票/行情.md) |
| 问"营收 / 利润 / 财报 / ROE / 增长率" | [`categories/股票/财务指标.md`](./categories/股票/财务指标.md) |
| 问"PE / PB / 估值 / 股息率" | [`categories/股票/估值指标.md`](./categories/股票/估值指标.md) |
| 问"基本资料 / 上市日期 / 行业归属" | [`categories/股票/基本资料.md`](./categories/股票/基本资料.md) |
| 问"ESG 评分" | [`categories/股票/ESG.md`](./categories/股票/ESG.md) |
| 问"GDP / CPI / 利率 / PMI" 等中国宏观 | [`categories/宏观经济.md`](./categories/宏观经济.md) |
| 问"公告 / 年报 / 招股书 / 新闻" | [`skills/wind-financial-data-skill.md`](./skills/wind-financial-data-skill.md)（`get_financial_documents`）|
| 问"沪深 300 / 板块 / 成分股" | [`categories/股票/行情.md`](./categories/股票/行情.md) 或 [`categories/指数/README.md`](./categories/指数/README.md) |
| 问"美股 / 期货 / 外汇 / 加密货币 / 债券 ..." | 对应 placeholder `categories/<asset>/README.md` —— 诚实告知"暂无收录"|
| 问"有什么 skill 可用 / 推荐工具" | 直接看上方"已开放 Skills"表 |
| 场景模糊（"分析白酒板块"）| 拆多步：先 quote 看板块成分 → 再 financial-data 看财务 / 估值 |

## 维护说明（给 AI 自己看）

- **诚实原则**：找不到对应 skill 时，**不要编造**，按 placeholder 文档里"暂无收录"的标准话术回答用户
- **Schema 真相优先**：description 自由文本提到的能力，要看 inputSchema enum_map 实测真相，不要顺手抄
- **更新流程**：每次新开放 skill / 工具 → 按 [`_sop.md`](./_sop.md) 9 步走
- **远程同步**：本 wiki 通过 wind-find-finance-skill 的 `scripts/cli.mjs` 远程优先 + 24h 缓存 + 本地基线兜底（详见 SOP §1 S9）

## Optional · 深度参考资料（non-essential）

下面是给 AI 在用户问"为什么这样推荐 / 维护流程是什么"等深度问题时备用，**正常推荐流程不需要读**：

- [`_sop.md`](./_sop.md) —— 维护 SOP（含完整测试用例约定）
- [`categories/_third_party_placeholder.md`](./categories/_third_party_placeholder.md) —— 第三方收录占位说明
- 定价与开发者中心：[aimarket.wind.com.cn](https://aimarket.wind.com.cn/) —— 注册 / 拿 API Key / 查看正式期定价
