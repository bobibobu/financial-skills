# test-project-level.mjs 项目级运行结果 (2026-05-24)

```
======================================================================
  项目级安装兼容性测试
  对比: 旧版（项目级安装 v1 lock）+ 新版脚本
======================================================================

环境信息:
  项目目录: C:\Users\Administrator\test-project
  项目 lock: C:\Users\Administrator\test-project\skills-lock.json (存在=true)
  项目旧版脚本: ...\.agents\skills\wind-mcp-skill\scripts\update-check.mjs (存在=true)
  新版脚本(仓库): ...\jsoncode-skills\...\update-check.mjs (存在=true)
  缓存文件: C:\Users\Administrator\.cache\wind-aifinmarket\update-state.json

项目级 lock 详情:
  lock version: 1
  source: Wind-Information-Co-Ltd/wind-skills
  sourceType: github
  sourceUrl: (缺失!)
  installedAt: (缺失!)
  updatedAt: (缺失!)
  computedHash: a937af8df4c539ad25e92995321b9028d478841d896003f01b7378e7b6fbeb10
  skillFolderHash: (缺失!)

  【重要差异】项目级 lock 是 v1 格式:
  - 没有 sourceUrl（只有 source 短形式）
  - 没有 installedAt / updatedAt
  - 新版脚本需要从 source+sourceType 推导 URL
  - 新版脚本无法走 installedAt 反查路径，只能走 computedHash 路径

======================================================================
场景 P1: 旧版项目级 update-check 生成旧缓存 → 检查格式
======================================================================
  清空缓存，运行旧版项目级 update-check...
  退出码: 0
  生成的缓存格式: 旧版(schemaVersion=3, skills=[wind-mcp-skill])
  skills["wind-mcp-skill"]:
    status: up_to_date
    lockSignature: C:\Users\Administrator\.agents\.skill-lock.json|2026-05-24T12:53:56.552Z
                   C:\Users\Administrator\test-project\skills-lock.json|
    lastCheck: 2026-05-24T13:09:11.928Z
  baselines: 1 条

======================================================================
场景 P2: 旧缓存(项目级生成) + 新版脚本运行
======================================================================
  不修改缓存，直接运行新版 update-check...
  退出码: 0
  运行后缓存格式: 新版(version=1, entries=[2条])
  entries: 2 条
    键: "wind-mcp-skill|c:\users\administrator\.agents\.skill-lock.json"
      latestSha: 694ddcf
      lastNotifiedSha: 694ddcf
      lockSignature: 2026-05-17T15:43:52.767Z
      lockSchemaVersion: 3
    键: "wind-mcp-skill|c:\users\administrator\test-project\skills-lock.json"
      latestSha: 694ddcf
      lastNotifiedSha: 694ddcf
      lockSignature: a937af8d...6fbeb10
      lockSchemaVersion: 1

  【关键发现】新版同时探测全局和项目级两个 lock，各自独立生成 entry

======================================================================
场景 P3: 手动构造旧版缓存 + 新版脚本（模拟升级场景）
======================================================================
  写入旧版缓存（项目级 scope=project, 含 snooze + baseline）
  运行新版 update-check...
  退出码: 0
  运行后格式: 新版(version=1, entries=[2条])
  【关键发现】旧缓存被覆盖为 version=1
  baselines 保留: false
  snoozedUntil 保留: false

======================================================================
场景 P4: 新版脚本能否找到项目级 lock 文件？
======================================================================
  清空缓存，运行新版 update-check (cwd=项目目录)...
  退出码: 0
  格式: 新版(version=1, entries=[2条])
  entries: 2 条
    键: "wind-mcp-skill|c:\users\administrator\.agents\.skill-lock.json"
    → 只找到全局 lock
    键: "wind-mcp-skill|c:\users\administrator\test-project\skills-lock.json"
    → 找到了项目级 lock!

  【关键发现】新版脚本能正确找到项目级 skills-lock.json

======================================================================
场景 P5: 新版脚本能否处理 v1 lock（缺 sourceUrl）？
======================================================================
  v1 lock entry 字段:
    source: Wind-Information-Co-Ltd/wind-skills
    sourceType: github
    sourceUrl: (缺失)

  新版 deriveSourceUrl 结果: https://github.com/Wind-Information-Co-Ltd/wind-skills.git
  解析结果: host=github, owner=Wind-Information-Co-Ltd, repo=wind-skills

  【关键发现】新版能从 source+sourceType 正确推导出完整 URL

======================================================================
场景 P6: 新版脚本能否处理 v1 lock（缺 installedAt）？
======================================================================
  v1 lock entry 没有 installedAt:
    installedAt: (缺失)
    updatedAt: (缺失)

  新版策略:
    v3 lock (有 installedAt): 反查装时刻 SHA
    v1 lock (无 installedAt): 首次 currentSha 设为基线

  v1 lock 在新版中的 lockSignature:
    buildLockSignature(entry, schemaVer=1): "a937af8d...6fbeb10"

  【关键发现】v1 lock 使用 computedHash 作为签名，缺失 installedAt 不影响功能

======================================================================
场景 P7: 新版 cli.mjs call 命令（项目级安装 + 旧缓存）
======================================================================
  写入旧版缓存
  运行新版 cli.mjs call...
  退出码: 1
  标准错误含更新通知: false

======================================================================
场景 P8: 真实升级（旧版项目级安装 → 安装新版 → 运行新脚本）
======================================================================
  安装新版到项目级后验证:
    lock version: 1
    source: JsonCodeChina/wind-skills
    sourceUrl: undefined (项目级 lock 始终不写此字段)
    安装的脚本是新版: 是 (CACHE_VERSION = 1)

  运行新版 update-check (旧缓存 schemaVersion=3 仍存在):
    旧缓存 → 新版(version=1, entries=[2条])
    全局 entry: lockSchemaVersion=3, latestSha=694ddcf
    项目 entry: lockSchemaVersion=1, latestSha=a816156

======================================================================
场景 P9: 项目级 v1 lock 的 lockSignature 签名对比
======================================================================
  v1 lock 签名使用 computedHash
  重装/升级后 computedHash 变化 → 签名变 → 触发重新探活（正确行为）

======================================================================
  补充: diagnose 输出（项目级安装新版后）
======================================================================
  cache_entries: [
    "wind-mcp-skill|c:\\users\\administrator\\.agents\\.skill-lock.json",
    "wind-mcp-skill|c:\\users\\administrator\\test-project\\skills-lock.json"
  ]
  新版同时管理全局和项目级两个 entry
```
