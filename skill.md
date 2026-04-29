---
name: wind-aimarket
description: 万得金融能力市场。一站找全 wind / 同花顺 / 社区的金融数据查询与金融分析 skill。
---

# Wind AIMarket

> AI 金融能力市场。装一个入口 skill，列举平台所有金融能力，按需安装。

## 安装入口

国外（GitHub）：

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-find-finance-skill -g -y
```

国内（Gitee 镜像）：

```bash
npx skills add https://gitee.com/jsonCodeChina/wind-skills.git --skill wind-find-finance-skill -g -y
```

---

## Skill 索引

按用户问题自然路由：取"数据"用数据发现类；做"分析"用金融分析类。

### 数据发现

> 取数 / 查询：行情、财务、新闻、研报、宏观指标、公司数据。

| 名称 | 平台版本 | 一句话 |
|---|---|---|
| wind-mcp-skill | 1.1.0 | 万得 6 server / 19 工具：行情 + 基金 + 股票 + 文档 RAG + 宏观 + 通用分析（A 股 / 港股 / 中国宏观） |

### 金融分析

> 决策 / 工作流：估值、复盘、选股、回测、个股研究、市场主线。

| 名称 | 平台版本 | 一句话 |
|---|---|---|
| a-share-primary-theme-identification | 1.0.0 | A 股市场主线识别（题材周期 / 资金行为） |
| backtest-expert | 1.0.0 | 量化策略系统化回测（压力测试） |
| buffett | 1.0.0 | 巴菲特投资思维体系（护城河 / 安全边际） |
| dcf-model | 1.0.0 | DCF 估值建模（WACC + 敏感性分析） |
| earnings-analysis | 1.0.0 | 季报点评（beat/miss + 估值更新） |
| equity-investment-thesis | 1.0.0 | 个股投资逻辑深度研究（券商研究员风格） |
| market-environment-analysis | 1.0.0 | 全球市场环境分析（risk-on / risk-off） |
| position-sizer | 1.0.0 | 仓位管理（风险 / Kelly / ATR） |
| post-market-debrief | 1.0.0 | 盘后复盘（市场全景 / 主线轮动） |
| theme-detector | 1.0.0 | 跨板块主题检测（FINVIZ + 生命周期） |
| valuation-pricing-framework | 1.0.0 | 估值与定价框架（重估空间判断） |

---

## 安装其他 skill（公式）

把"安装入口"命令里的 `wind-find-finance-skill` 换成索引表的 `名称` 即可：

```bash
# GitHub
npx skills add JsonCodeChina/wind-skills --skill <skill-name> -g -y
# Gitee
npx skills add https://gitee.com/jsonCodeChina/wind-skills.git --skill <skill-name> -g -y
```

## 升级所有已装 skill

```bash
npx skills update -g -y
```
