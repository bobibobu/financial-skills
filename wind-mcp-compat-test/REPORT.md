# wind-mcp-skill 更新脚本新旧缓存兼容性测试报告

> 测试日期: 2026-05-24
> 测试环境: Windows 10 Pro, Node.js v25.5.0
> 新版来源: https://github.com/JsonCodeChina/wind-skills.git
> 旧版来源: https://github.com/Wind-Information-Co-Ltd/wind-skills.git

## 1. 测试目的

验证用户从旧版 wind-mcp-skill 升级到新版后，旧版生成的缓存文件（`~/.cache/wind-aifinmarket/update-state.json`）是否能被新版更新脚本（`update-check.mjs`）正确处理。

核心问题：**旧版用的是旧缓存文件，脚本升级到新版后，能正常使用吗？会出现什么问题？**

## 2. 缓存格式差异

两个版本使用完全不同的缓存格式，但共享同一个文件路径：

| 维度 | 旧版（Wind-Info） | 新版（JsonCode） |
|------|-------------------|-----------------|
| 版本标识 | `schemaVersion: 3` | `version: 1` |
| 顶层结构 | `{schemaVersion, skills, baselines}` | `{version, meta, entries}` |
| 数据索引键 | `skillName`（如 `"wind-mcp-skill"`） | `skillName\|lockPath`（复合键） |
| 状态表达 | `status` 字段（`up_to_date` / `update_available` / `transient_error`） | `latestSha !== lastNotifiedSha`（SHA 对比） |
| 去重机制 | sentinel 文件（mtime 控制，文件系统级别） | `lastNotifiedSha` 字段（缓存内字段） |
| 探活策略 | installedAt 反查远端 commit + baseline 兜底 | ETag/304 + SHA 对比 + 首次设基线 |
| 脚本大小 | 674 行 / 19997 字节 | 463 行 / 26426 字节 |
| cli.mjs 大小 | 1132 行 / 46248 字节 | 656 行 / 24440 字节 |

## 3. 测试方案

设计了两个测试脚本，共 **24 个测试场景**：

- `test-compat.mjs` — 15 个通用兼容性测试（双向兼容、升降级模拟、真实安装验证）
- `test-old-cache-new-script.mjs` — 9 个专项场景（覆盖旧缓存各种状态在新版下的表现）

所有测试均在本地真实运行，使用实际的 lock 文件和远端 GitHub API 探活。

## 4. 测试结果总览

### 4.1 test-compat.mjs：19/19 全部通过

15 个测试场景的 19 个断言全部通过，零失败。

### 4.2 test-old-cache-new-script.mjs：9 个场景全部完成

每个场景都产生了明确的结果，无异常或崩溃。

## 5. 关键发现

### 5.1 核心行为：旧缓存被完全覆盖

**在每一个测试场景中，新版 `update-check.mjs` 运行后都将旧缓存从 `schemaVersion=3` 格式整体覆盖为 `version=1` 格式。**

这不是合并或兼容读取，而是直接覆写整个文件。新版 `readCache()` 函数检查 `data.version === 1`，旧缓存的 `schemaVersion: 3` 不匹配，直接返回空缓存，然后新版用自己的格式重写整个文件。

### 5.2 丢失的旧数据

| 旧缓存数据 | 运行新脚本后 | 用户影响 |
|---|---|---|
| `status` 字段 | **丢失** | 新版用 SHA 对比替代，无影响 |
| `outdated[]` 待更新列表 | **丢失** | 新版重新探活计算，无影响 |
| `snoozedUntil` / `snoozeLevel` | **丢失** | 用户暂停的通知状态失效（见 5.3） |
| `baselines{}` 节 | **丢失** | 新版不用 baselines 机制，无影响 |
| `skills{}` 按 skillName 索引 | **丢失** | 新版用复合键，无影响 |

### 5.3 snooze 状态丢失的实际影响

虽然 `snoozedUntil` 丢失，但新版首次运行时会设置 `lastNotifiedSha = latestSha`（将当前远端 SHA 设为"已通知"基线），这意味着新版认为用户"已经知道这个版本"。因此：

- **不会立即弹出之前暂停过的通知**（因为 lastNotifiedSha = latestSha）
- 只有远端后续发布新版本时，才会触发正常的更新通知
- 实际用户感知：**基本无感知**

### 5.4 sentinel 文件

旧版创建的 sentinel 文件（`update-shown-*`、`failure-shown-*`）在新版运行后：

- **不会被主动清理**（本次测试中未触发清理）
- **不影响新版行为**（新版完全不看 sentinel 文件）
- 新版使用缓存内的 `lastNotifiedSha` 字段做去重
- 残留 sentinel 文件会随时间被新版 `cleanupStaleSentinels()` 逐步清理

### 5.5 各场景具体表现

| 场景 | 旧缓存状态 | 新脚本行为 | 是否有副作用 |
|------|-----------|-----------|-------------|
| A. 有更新+已暂停 | `update_available` + `snoozedUntil` | 覆盖缓存，不输出通知 | snooze 丢失但不会骚扰用户 |
| B. 已最新+缓存新鲜 | `up_to_date` | 覆盖缓存，重新探活 | 无 |
| C. 探活失败 | `transient_error` | 覆盖缓存，重新探活 | 错误状态被清除（正面） |
| D. 含 baselines | `baselines` 有数据 | 覆盖缓存，baselines 丢失 | 新版不用此数据，无影响 |
| E. 缓存过期 30 天 | `lastCheck` 很旧 | 覆盖缓存，重新探活 | 无 |
| F. call 命令触发 | 异步 spawn | call 本身不修改缓存 | 异步子进程可能后续覆盖 |
| G. 连续运行两次 | 第二次在新格式上运行 | 正常递增 callCount | 无 |
| H. diagnose 命令 | 只读操作 | 不修改缓存 | 无 |
| I. sentinel 文件 | sentinel 存在 | 新脚本忽略 sentinel | 无 |

## 6. 降级兼容性（新版缓存 + 旧版脚本）

作为补充测试，也验证了反向场景：

- 旧版 `update-check.mjs` 遇到新版 `version=1` 缓存 → 视为无效 → 返回空缓存 → 用旧格式覆盖
- 旧版 `cli.mjs readCacheView()` 遇到新版缓存 → 当 legacy 处理 → `state.status = undefined` → 不崩溃、不误通知
- **结论：降级也是安全的**

## 7. 新旧交替场景

如果同时存在新旧版 skill 安装（不同项目引用不同版本）：

- 缓存文件会被两个版本的脚本交替覆盖
- 每次切换都会触发重新探活（因为格式不匹配）
- 性能有轻微损耗（多一次网络请求），但功能不受影响
- 不会崩溃、不会误通知

## 8. 真实安装测试

使用 `npx skills add` 进行了完整的安装升级测试：

1. 旧版已安装（sourceUrl 指向 Wind-Information-Co-Ltd），旧缓存 `schemaVersion=3`
2. 执行 `npx skills add https://github.com/JsonCodeChina/wind-skills.git --skill wind-mcp-skill -g -y`
3. 安装成功，lock 文件更新为新版 sourceUrl
4. 运行新版 `update-check.mjs` → 旧缓存被覆盖为 `version=1`
5. 运行新版 `cli.mjs diagnose` → 正常显示空 entries（因为旧缓存被忽略）
6. 运行新版 `cli.mjs call` → 正常工作（无 API key 场景正确报错）

## 9. 结论

### 新版脚本与旧缓存文件兼容吗？

**兼容，但采用"丢弃重建"策略。**

- **不会崩溃** — 新版 readCache 有容错，遇到旧格式返回空缓存
- **不会误通知** — 首次运行设 lastNotifiedSha = latestSha，不会误报
- **不会破坏主流程** — call 命令完全不受影响
- **旧数据全部丢失** — snooze/baselines/status/outdated 等字段不保留
- **用户基本无感知** — 唯一差异是 snooze 失效，但实际不会重新弹出通知

### 是否需要数据迁移？

**不需要。** 旧数据的价值有限：

- `snoozedUntil` 丢失但新版首次设基线，效果等价
- `baselines` 新版不使用此机制
- `status` / `outdated` 新版会重新计算
- `lastCheck` 新版重新探活

### 升级建议

可以直接升级，无需任何预处理或数据迁移。建议升级后执行一次 `cli.mjs call` 触发新版探活，让缓存尽快填充新格式数据。
