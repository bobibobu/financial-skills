# test-old-cache-new-script.mjs 专项运行结果 (2026-05-24)

```
======================================================================
  wind-mcp-skill 缓存兼容性专项测试
  对比: JsonCodeChina/wind-skills（新版） vs Wind-Information-Co-Ltd/wind-skills（旧版）
  测试日期: 2026-05-24
======================================================================

环境信息:
  缓存文件: C:\Users\Administrator\.cache\wind-aifinmarket\update-state.json
  Lock 文件: C:\Users\Administrator\.agents\.skill-lock.json
  新版脚本: ...\jsoncode-skills\...\update-check.mjs (存在=是)
  新版 CLI: ...\jsoncode-skills\...\cli.mjs (存在=是)
  Lock 源地址: https://github.com/Wind-Information-Co-Ltd/wind-skills.git

======================================================================
场景 A: 旧缓存 status=update_available + 用户已暂停通知（snooze）
======================================================================
  写入旧版缓存: 旧版(schemaVersion=3, skills=[wind-mcp-skill])
  status=update_available, snoozedUntil=2026-05-31T12:52:47.413Z
  运行新版 update-check.mjs...
  退出码: 0, 标准错误: (无)
  结果: 旧版(schemaVersion=3, skills=[wind-mcp-skill]) --> 新版(version=1, entries=[1 条])
  【关键发现】旧缓存被完全覆盖!
  丢失的旧字段: schemaVersion, skills, baselines, snoozedUntil, outdated
  新增字段: version=1, meta.callCount=1
  entry[wind-mcp-skill|c:\users\administrator\.agents\.skill-lock.json]: latestSha=694ddcf, lastNotifiedSha=694ddcf

======================================================================
场景 B: 旧缓存 status=up_to_date（缓存新鲜）
======================================================================
  运行新版 update-check.mjs...
  结果: 新版(version=1, entries=[1 条])
  结论: 新版无视旧缓存新鲜度，直接重新探活并覆盖

======================================================================
场景 C: 旧缓存 status=transient_error（上次探活失败）
======================================================================
  运行新版 update-check.mjs...
  结果: 新版(version=1, entries=[1 条])
  结论: 旧错误状态丢失，新版重新探活成功

======================================================================
场景 D: 旧缓存包含 baselines 节（v1 lock 兜底数据）
======================================================================
  写入旧版缓存（含 3 个 baseline 条目）
  运行新版 update-check.mjs...
  结果: 新版(version=1, entries=[1 条])
  baselines 节是否存在: 否
  【关键发现】baselines 节已被删除！旧版 baseline 数据全部丢失

======================================================================
场景 E: 旧缓存完全过期（lastCheck=30天前）
======================================================================
  运行新版 update-check.mjs...
  结果: 新版(version=1, entries=[1 条])
  是否检测到更新: 否（SHA 相同）
  latestSha=694ddcf, lastNotifiedSha=694ddcf

======================================================================
场景 F: 旧缓存 + 新版 cli.mjs call 命令
======================================================================
  写入旧版缓存（update_available 状态）
  运行新版 cli.mjs call...
  退出码: 1
  标准错误是否含更新通知: 否
  缓存格式: 旧版(schemaVersion=3, skills=[wind-mcp-skill])（call 触发的异步 update-check 可能还没完成）

======================================================================
场景 G: 新版 update-check 连续运行两次
======================================================================
  第一次运行...
  第一次后: 新版(version=1, entries=[1 条]), callCount=2
  第二次运行...
  第二次后: 新版(version=1, entries=[1 条]), callCount=3
  结论: 第一次覆盖旧缓存，第二次在新格式上正常工作

======================================================================
场景 H: 旧缓存 + 新版 cli.mjs diagnose 命令
======================================================================
  运行新版 cli.mjs diagnose...
  输出: {"platform":"win32","node_pid":27352,"cache_entries":[],"meta":{"callCount":0},"ttl_hours":6}
  diagnose 是否修改了缓存: 否

======================================================================
场景 I: 旧版 sentinel 文件对新脚本的影响
======================================================================
  创建 sentinel 文件
  运行新版 update-check...
  sentinel 仍存在: 是
  结论: sentinel 不影响新脚本，新脚本不读取 sentinel 文件

======================================================================
  最终对比总结
======================================================================

  旧缓存 --> 新脚本运行:
  格式标识: schemaVersion=3 --> version=1
  数据节: skills{} --> entries{}
  snoozedUntil: 2026-05-31T12:52:47 --> 全部丢失
  baselines: 0 条 --> 全部丢失
  status: update_available --> 新版不使用 status 字段
  lockSignature: C:\Users\Administrator\.agen --> 2026-05-17T15:43:52.767Z

已恢复原始缓存文件
```
