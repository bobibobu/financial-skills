---
name: aimarket
description: 全网金融能力一站式入口。装一次,AI 自动按问题推荐合适的能力。优先内置 Wind 万得数据。
---

# AIMarket — AI 金融能力市场

> 全网金融能力一站式入口。
> 装一次,AI 自动按问题推荐合适的能力。
> 优先内置 **Wind 万得**数据。

---

## 路径 A:装能力发现器(让 AI 帮你挑全网能力)

> 适合:不知道用哪个工具 / 想看平台都有什么能力。

国外(GitHub):

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-find-finance-skill -g -y
```

国内(Gitee 镜像):

```bash
npx skills add https://gitee.com/jsonCodeChina/wind-skills.git --skill wind-find-finance-skill -g -y
```

装好后任意 AI 对话提金融问题(行情 / 基金 / 估值 / 选股 / 复盘 / 回测 / 公告 / 宏观 ...),AI 会:

- 列出 1-3 个相关 skill 并给出安装命令让你挑装
- 推荐先装 **wind-mcp-skill** 作数据来源

---

## 路径 B:直接装 Wind 万得数据 skill

> 适合:已知要用 Wind 数据 / 重度查询用户。
> 覆盖 5 大类 / 22 个工具:基金(含 ETF 行情) · 股票(含行情) · 公告新闻 · 宏观 EDB · 通用 NL。

### Step 1 — 装 skill 包

国外(GitHub):

```bash
npx skills add JsonCodeChina/wind-skills --skill wind-mcp-skill -g -y
```

国内(Gitee 镜像):

```bash
npx skills add https://gitee.com/jsonCodeChina/wind-skills.git --skill wind-mcp-skill -g -y
```

### Step 2 — 让 AI 帮你拿 API Key

装好后向 AI 提一个金融数据问题(例:"贵州茅台最新股价"),AI 会自动:

1. 调 wind-mcp-skill 触发"未配置 Key"引导
2. 询问你是否同意打开浏览器
3. 同意后自动弹 `aimarket.wind.com.cn` 开发者中心(未登录跳登录页)
4. 你拿到 Key 后,AI 会按提示给你完整配置命令(推荐全局 `~/.wind-aimarket/config`,所有 wind skill 共享)

> 你也可以提前手动配置:
> ```bash
> mkdir -p ~/.wind-aimarket && \
>   echo "WIND_API_KEY=ak_xxx" > ~/.wind-aimarket/config
> ```

---

## 升级所有已装 skill

```bash
npx skills update -g -y
```

---

© AIMarket 2026 · 反馈与贡献:[github.com/JsonCodeChina/wind-skills](https://github.com/JsonCodeChina/wind-skills)
