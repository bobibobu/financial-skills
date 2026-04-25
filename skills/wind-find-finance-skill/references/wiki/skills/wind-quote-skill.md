---
type: skill
name: wind-quote-skill
vendor: wind
markets: [A股, 港股]
categories: [A股行情, 港股行情, 板块]
install: "npx skills add JsonCodeChina/wind-skills --skill wind-quote-skill -g -y"
status: stable
version: "0.3.0"
mcp_server: vserver_wind_quote
---

# wind-quote-skill · AI 档案

## 一句话描述

万得行情数据：A 股 / 港股股票的实时报价、K 线、分钟级走势、万得板块成分。

## 适合的用户问题

- "贵州茅台**最新价**是多少"
- "万科 A **今天涨跌**怎么样"
- "宁德时代**最近一个月 K 线**走势"
- "601318 平安**分钟级行情**"
- "**沪深 300 板块成分**有哪些"
- "**万得医疗器械**行业里都有哪些股票"

## 不要用本 skill 的场景

| 场景 | 应该用 |
|---|---|
| 财务数据（营收 / 利润 / ROE / 估值倍数）| [wind-financial-data-skill](./wind-financial-data-skill.md) |
| 公司公告 / 年报 / 招股书 / 研报 | [wind-financial-data-skill](./wind-financial-data-skill.md) |
| 美股 / 欧股 / 日股 / 加密货币 | 暂无收录，参见 [美股行情类目](../categories/美股行情.md) |
| 汇率 / 外汇 / 期货盘口 | 暂无收录 |

## 工具清单（4 个，封装 `vserver_wind_quote` MCP server）

| 工具名 | 功能 | 主参数 |
|---|---|---|
| `quote_get_indicators` | 实时行情快照（最新价、前收、涨跌、成交、成交额）| `windcode`, `indexes` |
| `quote_get_kline` | K 线（日 / 周 / 月，前复权 / 后复权 / 不复权）| `windcode`, `cycle`, `begin`, `end` |
| `quote_get_minute` | 分钟级行情（1m / 5m 等）| `windcode`, `begin`, `end` |
| `quote_sector_get_members_sorted` | 万得板块成分证券（行业 / 概念 / 主题 / 风格）| `sector_code` |

> 工具的完整 `inputSchema` 以装好 skill 后跑 `node scripts/cli.mjs list-tools` 拿到的实时输出为准。

## 安装与使用

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-quote-skill -g -y
```

需要 WIND_API_KEY，未配置时 skill 会主动询问用户、引导通过 `open-portal` 子命令打开 [aimarket.wind.com.cn](https://aimarket.wind.com.cn/#/user/overview) 拿 Key。详见装好后的 SKILL.md。

## 跟其他 skill 的协作

- **跨数据类型对比**："茅台股价 + 财务" → 先 quote-skill 拿股价，再 financial-data-skill 拿财务，AI 自己组合
- **板块分析**：先 quote-skill 拿板块成分（如"沪深 300"），再 financial-data-skill 跨标的对比财务

## 数据来源

万得金融终端（Wind Financial Terminal）。AI 向用户呈现结果时**必须附注：数据来源于 Wind 万得金融终端**。
