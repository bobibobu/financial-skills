---
name: wind-aimarket
description: 万得金融能力市场。一站找全 wind / 同花顺 / 社区的金融数据查询与金融分析 skill。
---

# Wind AIMarket

> 本文件是 https://aimarket.wind.com.cn/skill.md 的本地副本（同源）。
> 由 `npx skills update -g -y` 随 wind-find-finance-skill 一起更新。

## Skill 索引

按用户问题自然路由：取"数据"用数据发现类；做"分析"用金融分析类。

### 数据发现

> 取数 / 查询：行情、财务、新闻、研报、宏观指标、公司数据。

| 名称 | 平台版本 | 一句话 |
|---|---|---|

### 金融分析

> 决策 / 工作流：估值、复盘、选股、回测、个股研究、市场主线。

| 名称 | 平台版本 | 一句话 |
|---|---|---|

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
