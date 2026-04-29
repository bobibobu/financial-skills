---
name: sync-wind-skills
description: >-
  从源仓库 (JsonCodeChina/wind-skills) 拉取最新内容，同步 skills/ 目录和 README.md，
  然后推送到 GitHub (Wind-Information-Co-Ltd/wind-skills) 和 Gitee (wind_info/wind-skills) 两个目标仓库的 main 分支。
author: bobibobu
auto_invoke: false
security:
  child_process: true
  eval: false
  filesystem_read: true
  filesystem_write: true
  network: true
examples:
  - "同步 wind-skills 仓库并推送"
  - "更新 wind-skills 并推送到 GitHub 和 Gitee"
  - "sync wind skills repos"
---

# Wind Skills 仓库同步推送

从源仓库拉取最新 `skills/` 目录和 `README.md`，推送到两个目标仓库的 `main` 分支。

## 仓库配置

| 角色 | 地址 |
|------|------|
| 源仓库 | `https://github.com/JsonCodeChina/wind-skills.git` |
| 目标 - GitHub | `https://github.com/Wind-Information-Co-Ltd/wind-skills.git` |
| 目标 - Gitee | `https://gitee.com/wind_info/wind-skills.git` |

## 同步规则

- **只同步**: `skills/` 目录 + `README.md`
- **分支**: 始终推送到 `main` 分支
- **代理**: 需要 `http://127.0.0.1:7897` 代理访问 GitHub

## 执行步骤

按以下步骤执行，**所有步骤必须按顺序完成**：

### 1. 拉取源仓库最新内容

```bash
cd /tmp/wind-skills-source && git pull
```

如果目录不存在，先克隆：

```bash
cd /tmp && git clone https://github.com/JsonCodeChina/wind-skills.git wind-skills-source
```

### 2. 同步文件到推送仓库

```bash
cd /tmp/wind-skills-push && rm -rf skills/ README.md && cp -r /tmp/wind-skills-source/skills/ . && cp /tmp/wind-skills-source/README.md .
```

如果推送仓库不存在，先初始化：

```bash
cd /tmp && mkdir -p wind-skills-push && cd wind-skills-push && git init
git remote add github https://github.com/Wind-Information-Co-Ltd/wind-skills.git
git remote add gitee https://gitee.com/wind_info/wind-skills.git
cp -r /tmp/wind-skills-source/skills/ .
cp /tmp/wind-skills-source/README.md .
```

### 3. 确保在 main 分支上

```bash
cd /tmp/wind-skills-push && git branch -m master main 2>/dev/null; git checkout main 2>/dev/null
```

### 4. 提交变更

```bash
cd /tmp/wind-skills-push && git add -A && git diff --cached --stat
```

**如果有变更**，执行提交：

```bash
cd /tmp/wind-skills-push && git config user.name "bobibobu" && git config user.email "3272871858@qq.com"
cd /tmp/wind-skills-push && git commit -m "Sync latest updates from source repo

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

**如果没有变更**，告知用户"源仓库无新更新"。

### 5. 推送到两个目标仓库

```bash
cd /tmp/wind-skills-push && git push github main
cd /tmp/wind-skills-push && git push gitee main
```

## 完成后报告

推送完成后，向用户报告：
- 同步了哪些文件（从 `git diff --cached --stat` 的结果）
- 两个目标仓库的推送状态
