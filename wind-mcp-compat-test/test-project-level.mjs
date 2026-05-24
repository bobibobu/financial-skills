#!/usr/bin/env node
// 项目级安装专项测试：旧缓存 + 新版更新脚本
// 项目级 lock 是 version=1（非 v3），缺少 sourceUrl/installedAt，只有 source + computedHash
// 这条路径在全局测试中完全没有覆盖到
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CACHE_DIR = join(homedir(), '.cache', 'wind-aifinmarket');
const CACHE_FILE = join(CACHE_DIR, 'update-state.json');
const PROJECT_DIR = join(homedir(), 'test-project');
const PROJECT_LOCK = join(PROJECT_DIR, 'skills-lock.json');
const PROJECT_SKILL_DIR = join(PROJECT_DIR, '.agents', 'skills', 'wind-mcp-skill');
const PROJECT_OLD_SCRIPT = join(PROJECT_SKILL_DIR, 'scripts', 'update-check.mjs');
const PROJECT_OLD_CLI = join(PROJECT_SKILL_DIR, 'scripts', 'cli.mjs');
const NEW_SCRIPT_REPO = join(homedir(), 'AppData', 'Local', 'Temp', 'jsoncode-skills', 'skills', 'wind-mcp-skill', 'scripts', 'update-check.mjs');
const NEW_CLI_REPO = join(homedir(), 'AppData', 'Local', 'Temp', 'jsoncode-skills', 'skills', 'wind-mcp-skill', 'scripts', 'cli.mjs');

function cacheType(data) {
  if (data.schemaVersion === 3) return `旧版(schemaVersion=3, skills=[${Object.keys(data.skills||{}).join(',')}])`;
  if (data.version === 1) return `新版(version=1, entries=[${Object.keys(data.entries||{}).length}条])`;
  return `未知(键=[${Object.keys(data).join(',')}])`;
}

// 备份
const BACKUP = CACHE_FILE + '.project-test-backup';
let hadBackup = false;
if (existsSync(CACHE_FILE)) { writeFileSync(BACKUP, readFileSync(CACHE_FILE)); hadBackup = true; }
let lockBackup = null;
if (existsSync(PROJECT_LOCK)) { lockBackup = readFileSync(PROJECT_LOCK); }

try {
console.log('='.repeat(70));
console.log('  项目级安装兼容性测试');
console.log('  对比: 旧版（项目级安装 v1 lock）+ 新版脚本');
console.log('='.repeat(70));

console.log(`\n环境信息:`);
console.log(`  项目目录: ${PROJECT_DIR}`);
console.log(`  项目 lock: ${PROJECT_LOCK} (存在=${existsSync(PROJECT_LOCK)})`);
console.log(`  项目旧版脚本: ${PROJECT_OLD_SCRIPT} (存在=${existsSync(PROJECT_OLD_SCRIPT)})`);
console.log(`  新版脚本(仓库): ${NEW_SCRIPT_REPO} (存在=${existsSync(NEW_SCRIPT_REPO)})`);
console.log(`  缓存文件: ${CACHE_FILE}`);

// 显示项目级 lock 内容
const projLock = JSON.parse(readFileSync(PROJECT_LOCK, 'utf8'));
console.log(`\n项目级 lock 详情:`);
console.log(`  lock version: ${projLock.version}`);
const projEntry = projLock.skills?.['wind-mcp-skill'];
console.log(`  source: ${projEntry?.source}`);
console.log(`  sourceType: ${projEntry?.sourceType}`);
console.log(`  sourceUrl: ${projEntry?.sourceUrl ?? '(缺失!)'}`);
console.log(`  installedAt: ${projEntry?.installedAt ?? '(缺失!)'}`);
console.log(`  updatedAt: ${projEntry?.updatedAt ?? '(缺失!)'}`);
console.log(`  computedHash: ${projEntry?.computedHash}`);
console.log(`  skillFolderHash: ${projEntry?.skillFolderHash ?? '(缺失!)'}`);

console.log(`\n  【重要差异】项目级 lock 是 v1 格式:`);
console.log(`  - 没有 sourceUrl（只有 source 短形式）`);
console.log(`  - 没有 installedAt / updatedAt`);
console.log(`  - 新版脚本需要从 source+sourceType 推导 URL`);
console.log(`  - 新版脚本无法走 installedAt 反查路径，只能走 computedHash 路径`);

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 P1: 旧版项目级 update-check 生成旧缓存 → 检查格式');
console.log('='.repeat(70));

// 先清空缓存，让旧版脚本从零开始
if (existsSync(CACHE_FILE)) { try { unlinkSync(CACHE_FILE); } catch {} }
console.log('  清空缓存，运行旧版项目级 update-check...');
const r1 = spawnSync('node', [PROJECT_OLD_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true, cwd: PROJECT_DIR });
console.log(`  退出码: ${r1.status}`);
if (r1.stderr) console.log(`  标准错误: ${r1.stderr.trim().slice(0, 300)}`);

if (existsSync(CACHE_FILE)) {
  const cache1 = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  console.log(`  生成的缓存格式: ${cacheType(cache1)}`);
  if (cache1.schemaVersion === 3) {
    const skillState = cache1.skills?.['wind-mcp-skill'];
    console.log(`  skills["wind-mcp-skill"]:`);
    console.log(`    status: ${skillState?.status}`);
    console.log(`    lockSignature: ${skillState?.lockSignature}`);
    console.log(`    lastCheck: ${skillState?.lastCheck}`);
    if (skillState?.outdated) {
      console.log(`    outdated: ${JSON.stringify(skillState.outdated).slice(0, 200)}`);
    }
  }
  console.log(`  baselines: ${cache1.baselines ? Object.keys(cache1.baselines).length + ' 条' : '无'}`);
} else {
  console.log('  缓存文件未生成!');
}

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 P2: 旧缓存(项目级生成) + 新版脚本运行');
console.log('='.repeat(70));

// 保留 P1 生成的缓存，直接运行新版
console.log('  不修改缓存，直接运行新版 update-check...');
const r2 = spawnSync('node', [NEW_SCRIPT_REPO], { encoding: 'utf8', timeout: 30000, windowsHide: true, cwd: PROJECT_DIR });
console.log(`  退出码: ${r2.status}`);
if (r2.stderr) console.log(`  标准错误: ${r2.stderr.trim().slice(0, 300)}`);

if (existsSync(CACHE_FILE)) {
  const cache2 = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  console.log(`  运行后缓存格式: ${cacheType(cache2)}`);
  if (cache2.version === 1) {
    const entries = Object.entries(cache2.entries || {});
    console.log(`  entries: ${entries.length} 条`);
    for (const [key, val] of entries) {
      console.log(`    键: "${key}"`);
      console.log(`      latestSha: ${val.latestSha}`);
      console.log(`      lastNotifiedSha: ${val.lastNotifiedSha}`);
      console.log(`      lockSignature: ${val.lockSignature}`);
      console.log(`      lockSchemaVersion: ${val.lockSchemaVersion}`);
    }
  } else if (cache2.schemaVersion === 3) {
    console.log(`  新版脚本未修改缓存（可能没找到项目级 lock）`);
  }
}

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 P3: 手动构造旧版缓存 + 新版脚本（模拟升级场景）');
console.log('='.repeat(70));

const OLD_PROJECT_CACHE = {
  schemaVersion: 3,
  skills: {
    "wind-mcp-skill": {
      status: "update_available",
      outdated: [{
        name: "wind-mcp-skill",
        current: "aaaa111",
        latest: "bbbb222",
        sourceUrl: "https://github.com/Wind-Information-Co-Ltd/wind-skills.git",
        installedHash: "oldprojecthash",
        scope: "project",
      }],
      ttlMs: 43200000,
      lockSignature: "C:\\Users\\Administrator\\test-project\\skills-lock.json|",
      lastCheck: new Date().toISOString(),
      snoozedUntil: new Date(Date.now() + 86400000).toISOString(),
      snoozeLevel: 1,
    }
  },
  baselines: {
    "C:\\Users\\Administrator\\test-project\\skills-lock.json:wind-mcp-skill:oldhash1": { remoteSha: "aaaa1111" }
  }
};

writeFileSync(CACHE_FILE, JSON.stringify(OLD_PROJECT_CACHE, null, 2));
console.log(`  写入旧版缓存（项目级 scope=project, 含 snooze + baseline）`);

console.log('  运行新版 update-check...');
const r3 = spawnSync('node', [NEW_SCRIPT_REPO], { encoding: 'utf8', timeout: 30000, windowsHide: true, cwd: PROJECT_DIR });
console.log(`  退出码: ${r3.status}`);
if (r3.stderr) console.log(`  标准错误: ${r3.stderr.trim().slice(0, 300)}`);

const cache3 = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
console.log(`  运行后格式: ${cacheType(cache3)}`);
if (cache3.version === 1) {
  console.log(`  【关键发现】旧缓存被覆盖为 version=1`);
  const entries = Object.entries(cache3.entries || {});
  console.log(`  entries: ${entries.length} 条`);
  for (const [key, val] of entries) {
    console.log(`    键: "${key}"`);
    console.log(`    latestSha: ${val.latestSha}`);
    console.log(`    lastNotifiedSha: ${val.lastNotifiedSha}`);
    console.log(`    lockSchemaVersion: ${val.lockSchemaVersion}`);
    console.log(`    是否检测到更新: ${val.latestSha !== val.lastNotifiedSha ? '是' : '否'}`);
  }
  console.log(`  baselines 保留: ${!!cache3.baselines}`);
  console.log(`  snoozedUntil 保留: ${!!cache3.skills?.['wind-mcp-skill']?.snoozedUntil}`);
}

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 P4: 新版脚本能否找到项目级 lock 文件？');
console.log('='.repeat(70));

// 清空缓存，让新版从零开始
if (existsSync(CACHE_FILE)) { try { unlinkSync(CACHE_FILE); } catch {} }
console.log('  清空缓存，运行新版 update-check (cwd=项目目录)...');
const r4 = spawnSync('node', [NEW_SCRIPT_REPO], { encoding: 'utf8', timeout: 30000, windowsHide: true, cwd: PROJECT_DIR });
console.log(`  退出码: ${r4.status}`);

if (existsSync(CACHE_FILE)) {
  const cache4 = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  console.log(`  格式: ${cacheType(cache4)}`);
  if (cache4.version === 1) {
    const entries = Object.entries(cache4.entries || {});
    console.log(`  entries: ${entries.length} 条`);
    for (const [key, val] of entries) {
      console.log(`    键: "${key}"`);
      // 键是否包含项目级路径?
      if (key.includes('test-project')) {
        console.log(`    → 找到了项目级 lock!`);
      } else if (key.includes('.agents')) {
        console.log(`    → 只找到全局 lock`);
      }
    }
  }
} else {
  console.log('  缓存未生成!');
}

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 P5: 新版脚本能否处理 v1 lock（缺 sourceUrl）？');
console.log('='.repeat(70));

// v1 lock 没有 sourceUrl，只有 source 短形式 + sourceType
// 新版 deriveSourceUrl 逻辑: entry.sourceUrl → 缺 → entry.source 是 http? → 否 →
// entry.sourceType === 'github' → 拼接
console.log('  v1 lock entry 字段:');
console.log(`    source: ${projEntry.source}`);
console.log(`    sourceType: ${projEntry.sourceType}`);
console.log(`    sourceUrl: ${projEntry.sourceUrl ?? '(缺失)'}`);

// 用新版模块测试 deriveSourceUrl
const mod = await import(`file:///${NEW_SCRIPT_REPO.replace(/\\/g, '/')}?t=${Date.now()}`);
const derived = mod.deriveSourceUrl(projEntry);
console.log(`\n  新版 deriveSourceUrl 结果: ${derived ?? '(null - 无法推导!)'}`);
if (derived) {
  const parsed = mod.parseSourceUrl(derived);
  console.log(`  解析结果: host=${parsed?.host}, owner=${parsed?.owner}, repo=${parsed?.repo}`);
}

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 P6: 新版脚本能否处理 v1 lock（缺 installedAt）？');
console.log('='.repeat(70));

console.log('  v1 lock entry 没有 installedAt:');
console.log(`    installedAt: ${projEntry.installedAt ?? '(缺失)'}`);
console.log(`    updatedAt: ${projEntry.updatedAt ?? '(缺失)'}`);
console.log('');
console.log('  新版策略:');
console.log('    v3 lock (有 installedAt): 反查装时刻 SHA');
console.log('    v1 lock (无 installedAt): 首次 currentSha 设为基线');
console.log('');
console.log('  v1 lock 在新版中的 lockSignature:');
const sig = mod.buildLockSignature(projEntry, 1);
console.log(`    buildLockSignature(entry, schemaVer=1): "${sig}"`);

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 P7: 新版 cli.mjs call 命令（项目级安装 + 旧缓存）');
console.log('='.repeat(70));

// 写旧缓存
writeFileSync(CACHE_FILE, JSON.stringify(OLD_PROJECT_CACHE, null, 2));
console.log('  写入旧版缓存');
console.log('  运行新版 cli.mjs call...');
const r7 = spawnSync('node', [NEW_CLI_REPO, 'call', 'stock_data', 'get_stock_basicinfo', '{"question":"test"}'], {
  encoding: 'utf8', timeout: 15000, windowsHide: true, cwd: PROJECT_DIR,
});
console.log(`  退出码: ${r7.status}`);
const stderr7 = r7.stderr || '';
console.log(`  标准错误含更新通知: ${stderr7.includes('wind-skills') || stderr7.includes('notice')}`);
if (stderr7) console.log(`  标准错误: ${stderr7.trim().slice(0, 200)}`);

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 P8: 真实升级 — 旧版项目级安装 → 安装新版 → 运行新脚本');
console.log('='.repeat(70));

// 先用旧版生成真实缓存
if (existsSync(CACHE_FILE)) { try { unlinkSync(CACHE_FILE); } catch {} }
console.log('  1) 用旧版脚本生成真实缓存...');
spawnSync('node', [PROJECT_OLD_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true, cwd: PROJECT_DIR });
if (existsSync(CACHE_FILE)) {
  const cache8a = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  console.log(`     旧版生成: ${cacheType(cache8a)}`);
} else {
  console.log('     旧版未生成缓存');
}

console.log('\n  2) 安装新版到项目级...');
const installResult = spawnSync('npx', ['skills', 'add', 'https://github.com/JsonCodeChina/wind-skills.git', '--skill', 'wind-mcp-skill', '-y'], {
  encoding: 'utf8', timeout: 120000, windowsHide: true, cwd: PROJECT_DIR,
});
console.log(`     安装退出码: ${installResult.status}`);

// 检查安装后的 lock 文件
const lockAfter = JSON.parse(readFileSync(PROJECT_LOCK, 'utf8'));
console.log(`     lock version: ${lockAfter.version}`);
const entryAfter = lockAfter.skills?.['wind-mcp-skill'];
console.log(`     source: ${entryAfter?.source}`);
console.log(`     sourceUrl: ${entryAfter?.sourceUrl}`);
console.log(`     installedAt: ${entryAfter?.installedAt ?? '(缺失)'}`);

// 检查项目级脚本是否更新
const newScriptInstalled = join(PROJECT_SKILL_DIR, 'scripts', 'update-check.mjs');
const newCliInstalled = join(PROJECT_SKILL_DIR, 'scripts', 'cli.mjs');
const scriptContent = readFileSync(newScriptInstalled, 'utf8');
const isNewVersion = scriptContent.includes('CACHE_VERSION = 1');
console.log(`     安装的脚本是新版: ${isNewVersion}`);

console.log('\n  3) 用新版脚本运行（旧缓存仍存在）...');
if (existsSync(CACHE_FILE)) {
  const beforeRun = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  console.log(`     运行前缓存: ${cacheType(beforeRun)}`);
}
const r8 = spawnSync('node', [newScriptInstalled], { encoding: 'utf8', timeout: 30000, windowsHide: true, cwd: PROJECT_DIR });
console.log(`     退出码: ${r8.status}`);
if (r8.stderr) console.log(`     标准错误: ${r8.stderr.trim().slice(0, 300)}`);

if (existsSync(CACHE_FILE)) {
  const cache8c = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  console.log(`     运行后缓存: ${cacheType(cache8c)}`);
  if (cache8c.version === 1) {
    for (const [key, val] of Object.entries(cache8c.entries || {})) {
      console.log(`     entry[${key}]:`);
      console.log(`       latestSha: ${val.latestSha}`);
      console.log(`       lastNotifiedSha: ${val.lastNotifiedSha}`);
      console.log(`       lockSchemaVersion: ${val.lockSchemaVersion}`);
    }
  }
}

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 P9: 项目级 v1 lock 的 lockSignature 签名对比');
console.log('='.repeat(70));

// v1 lock 签名: computedHash（不是 installedAt）
// 升级新版后 hash 变了 → 签名变了 → 触发重新探活
console.log('  v1 lock 的签名逻辑:');
console.log('    旧版: 所有 entries 排序拼接 "lockPath|updatedAt/installedAt"');
console.log('    新版(v1 lock): buildLockSignature 使用 computedHash/skillFolderHash');
console.log(`    当前 entry computedHash: ${entryAfter?.computedHash ?? entryAfter?.skillFolderHash}`);
console.log('');
console.log('  当客户重装/升级 skill 后 computedHash 变化:');
console.log('    → lockSignature 变化 → 新版 computeStale 判定为过期 → 重新探活');
console.log('    → 这是正确的行为');

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('  项目级测试总结');
console.log('='.repeat(70));

console.log(`
  项目级安装 vs 全局安装的关键差异:
  ┌──────────────────────┬──────────────────────┬──────────────────────┐
  │ 维度                 │ 全局安装 (-g)        │ 项目级安装           │
  ├──────────────────────┼──────────────────────┼──────────────────────┤
  │ lock 文件位置        │ ~/.agents/.skill-    │ 项目根目录/skills-   │
  │                      │ lock.json            │ lock.json            │
  │ lock version         │ v3                   │ v1                   │
  │ sourceUrl 字段       │ 有                   │ 无（只有 source 短名）│
  │ installedAt 字段     │ 有                   │ 无                   │
  │ updatedAt 字段       │ 有                   │ 无                   │
  │ computedHash 字段    │ 无（用skillFolderHash）│ 有                  │
  │ 新版 URL 推导        │ 直接用 sourceUrl     │ 从 source+sourceType │
  │                      │                      │ 拼接                 │
  │ 新版探活路径         │ installedAt 反查     │ 首次设基线           │
  │ 升级命令             │ 带 -g                │ 不带 -g              │
  └──────────────────────┴──────────────────────┴──────────────────────┘
`);

} finally {
  if (hadBackup && existsSync(BACKUP)) { writeFileSync(CACHE_FILE, readFileSync(BACKUP)); try { unlinkSync(BACKUP); } catch {} console.log('\n已恢复原始缓存'); }
  if (lockBackup) { writeFileSync(PROJECT_LOCK, lockBackup); console.log('已恢复项目级 lock'); }
}
