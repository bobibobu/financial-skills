# test-compat.mjs 运行结果 (2026-05-24)

```
=== 测试 1: 新版 readCache 读取旧版 v3 缓存 ===
  通过: 返回 version=1 (旧版 schemaVersion=3 不匹配 CACHE_VERSION=1)
  通过: 返回空 entries
  影响: 新版脚本将旧版 v3 缓存视为无效，触发重新探活

=== 测试 2: 旧版 readUnifiedCache 读取新版 v1 缓存 ===
  通过: schemaVersion 字段缺失或不等于3
  影响: 旧版脚本将新版 v1 缓存视为无效，触发重新探活

=== 测试 3: 直接运行旧版 update-check.mjs（旧版 v3 缓存存在时） ===
  退出码: 0
  标准错误: [wind-skills] 检测到 1 个 skill 有新版:  • wind-mcp-skill  9c67f63 → 694ddcf  升级: npx skills update wind-mcp-skill -g -y
  运行后: schemaVersion=3, skills=[wind-mcp-skill]
  通过: 旧版脚本保持 schemaVersion=3 格式不变

=== 测试 4: 直接运行新版 update-check.mjs（旧版 v3 缓存存在时） ===
  退出码: 0
  运行后: 顶层键为 version,meta,entries
  --> 新版脚本将旧缓存完全覆盖为 version=1 格式
  entries: wind-mcp-skill|c:\users\administrator\.agents\.skill-lock.json
  通过: 新版脚本覆盖旧缓存

=== 测试 5: 旧版 cli.mjs readCacheView 读取新版 v1 缓存 ===
  通过: 旧版 cli 将新版缓存视为 legacy 格式
  通过: state.status=undefined -> 不通知、不崩溃
  影响: 旧版 cli 将新版缓存当 legacy 读，status=undefined -> 静默无动作

=== 测试 6: 新版 cli.mjs readCache 读取旧版 v3 缓存 ===
  通过: 返回空缓存（version=1）
  通过: entries 为空
  影响: 新版脚本将旧缓存视为无效，触发重新探活，旧数据丢失

=== 测试 7: 升级场景模拟（旧缓存 -> 新脚本运行） ===
  --> 覆盖为 version=1，entries=1 条
  通过: 升级场景正常

=== 测试 8: 降级场景模拟（新缓存 -> 旧脚本运行） ===
  --> 旧版脚本覆盖为 schemaVersion=3
  通过: 降级场景正常

=== 测试 9: 存在 lock 文件时 - 新版脚本真实升级场景 ===
  退出码: 0
  格式: 新版（version=1）
  entries: 2 条
    键=wind-mcp-skill|c:\users\administrator\.agents\.skill-lock.json
    值={"lockSchemaVersion":3,"latestSha":"694ddcf16b72c99c1d364c62f7567d368cb60b5a",...}
    键=wind-mcp-skill|c:\users\administrator\compat-test\skills-lock.json
    值={"lockSchemaVersion":3,"latestSha":"a816156a5ba34e48332c840cab96232ceac5e919",...}
  通过: 新版脚本找到 lock 文件并创建了 entries

=== 测试 10: 新版 cli.mjs diagnose 命令（旧缓存存在时） ===
  标准输出: { "platform": "win32", "node_pid": 25336, "cache_file": "...", "cache_entries": [], "meta": {"callCount": 0} }
  通过: diagnose 命令正常退出

=== 测试 11: 升级后 snooze（暂停通知）状态丢失 ===
  通过: snooze 状态丢失
  影响: 用户暂停通知的设置丢失，可能重新弹出已暂停的通知

=== 测试 12: sentinel 文件兼容性 ===
  旧版使用 sentinel 文件（基于 mtime 去重）
  新版使用 lastNotifiedSha 缓存字段
  --> sentinel 文件不影响新版脚本
  通过: sentinel 文件互不干扰

=== 测试 13: baseline 数据（旧版 v1 lock 兜底数据） ===
  通过: baseline 数据被新版忽略
  影响: 旧版 baseline 数据丢失，但新版使用不同策略，无实际影响

=== 测试 14: 新旧脚本交替运行（旧 -> 新 -> 旧） ===
  步骤 1: 写入旧版缓存
  步骤 2: 旧版脚本运行后: schemaVersion=3
  通过: 旧版脚本保持 v3 格式
  步骤 3: 新版脚本运行后: version=1, schemaVersion=undefined
  步骤 4: 旧版脚本再次运行后: schemaVersion=3, version=undefined
  通过: 交替运行未崩溃

=== 测试 15: 真实已安装 skill 测试 ===
  全局 lock 文件已找到: C:\Users\Administrator\.agents\.skill-lock.json
  Lock 版本: 3
  找到条目: sourceUrl=https://github.com/Wind-Information-Co-Ltd/wind-skills.git, installedAt=2026-05-17T15:43:52.767Z
  新版脚本运行后: version=1（新格式）
  entries 数量: 1
    键: wind-mcp-skill|c:\users\administrator\.agents\.skill-lock.json
    latestSha: 694ddcf16b72c99c1d364c62f7567d368cb60b5a
    lastNotifiedSha: 9c67f63f25fb3dd25fea170c01b5e7956c1e8d10
  通过: 真实已安装 skill 测试通过

============================================================
测试结果: 19/19 通过, 0/19 失败
============================================================
```
