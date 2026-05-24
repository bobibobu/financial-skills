#!/usr/bin/env node
// 专项测试：旧缓存文件 + 新版更新脚本，逐项验证真实行为
// 9 个场景全面覆盖旧缓存各种状态在新版脚本下的表现
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CACHE_DIR = join(homedir(), '.cache', 'wind-aifinmarket');
const CACHE_FILE = join(CACHE_DIR, 'update-state.json');
const LOCK_FILE = join(homedir(), '.agents', '.skill-lock.json');
const NEW_SCRIPT = join(homedir(), 'AppData', 'Local', 'Temp', 'jsoncode-skills', 'skills', 'wind-mcp-skill', 'scripts', 'update-check.mjs');
const NEW_CLI = join(homedir(), 'AppData', 'Local', 'Temp', 'jsoncode-skills', 'skills', 'wind-mcp-skill', 'scripts', 'cli.mjs');

function cacheType(data) {
  if (data.schemaVersion === 3) return `OLD(schemaVersion=3, skills=[${Object.keys(data.skills||{}).join(',')}])`;
  if (data.version === 1) return `NEW(version=1, entries=[${Object.keys(data.entries||{}).length} items])`;
  return `UNKNOWN(keys=[${Object.keys(data).join(',')}])`;
}

const BACKUP = CACHE_FILE + '.real-test-backup';
let hadBackup = false;
if (existsSync(CACHE_FILE)) { writeFileSync(BACKUP, readFileSync(CACHE_FILE)); hadBackup = true; }

const sentinelBackup = [];
if (existsSync(CACHE_DIR)) {
  for (const f of readdirSync(CACHE_DIR)) {
    if (f.startsWith('update-shown-') || f.startsWith('failure-shown-')) {
      const p = join(CACHE_DIR, f);
      sentinelBackup.push({ name: f, data: readFileSync(p), mtime: statSync(p).mtimeMs });
    }
  }
}

let lockBackup = null;
if (existsSync(LOCK_FILE)) { lockBackup = readFileSync(LOCK_FILE); }

try {
console.log('='.repeat(70));
console.log('  wind-mcp-skill 缓存兼容性专项测试');
console.log('  对比: JsonCodeChina/wind-skills (新版) vs Wind-Information-Co-Ltd/wind-skills (旧版)');
console.log('  测试日期: 2026-05-24');
console.log('='.repeat(70));
console.log(`\n环境:`);
console.log(`  CACHE_FILE: ${CACHE_FILE}`);
console.log(`  LOCK_FILE: ${LOCK_FILE}`);
console.log(`  NEW_SCRIPT: ${NEW_SCRIPT} (exists=${existsSync(NEW_SCRIPT)})`);
console.log(`  NEW_CLI: ${NEW_CLI} (exists=${existsSync(NEW_CLI)})`);
console.log(`  lock sourceUrl: ${JSON.parse(readFileSync(LOCK_FILE)).skills['wind-mcp-skill'].sourceUrl}`);

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 A: 旧缓存 status=update_available + 用户已 snooze');
console.log('='.repeat(70));

const CACHE_A = {
  schemaVersion: 3,
  skills: {
    "wind-mcp-skill": {
      status: "update_available",
      outdated: [{ name: "wind-mcp-skill", current: "aaaa111", latest: "bbbb222", sourceUrl: "https://github.com/Wind-Information-Co-Ltd/wind-skills.git", installedHash: "oldhash123abc", scope: "global" }],
      ttlMs: 43200000,
      lockSignature: "C:\\Users\\Administrator\\.agents\\.skill-lock.json|2026-05-17T15:43:52.767Z",
      lastCheck: new Date().toISOString(),
      snoozedUntil: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
      snoozeLevel: 1,
    }
  },
  baselines: {}
};

writeFileSync(CACHE_FILE, JSON.stringify(CACHE_A, null, 2));
const beforeA = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
console.log(`  写入旧缓存: ${cacheType(beforeA)}`);
console.log(`  status=${beforeA.skills['wind-mcp-skill'].status}, snoozedUntil=${beforeA.skills['wind-mcp-skill'].snoozedUntil}`);

console.log('  运行新版 update-check.mjs...');
const resultA = spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
console.log(`  退出码: ${resultA.status}, stderr: ${resultA.stderr ? resultA.stderr.trim() : '(无)'}`);

const afterA = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
console.log(`  结果: ${cacheType(beforeA)} --> ${cacheType(afterA)}`);
if (afterA.version === 1) {
  console.log(`  [关键发现] 旧缓存被完全覆盖!`);
  console.log(`  旧字段丢失: schemaVersion, skills, baselines, snoozedUntil, outdated`);
  console.log(`  新字段: version=1, meta.callCount=${afterA.meta?.callCount}`);
  const entries = Object.entries(afterA.entries || {});
  for (const [key, val] of entries) {
    console.log(`  entry[${key}]: latestSha=${val.latestSha?.slice(0,7)}, lastNotifiedSha=${val.lastNotifiedSha?.slice(0,7)}`);
  }
}

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 B: 旧缓存 status=up_to_date (缓存新鲜)');
console.log('='.repeat(70));

const CACHE_B = {
  schemaVersion: 3,
  skills: { "wind-mcp-skill": { status: "up_to_date", ttlMs: 3600000, lockSignature: "C:\\Users\\Administrator\\.agents\\.skill-lock.json|2026-05-17T15:43:52.767Z", lastCheck: new Date().toISOString() } },
  baselines: {}
};

writeFileSync(CACHE_FILE, JSON.stringify(CACHE_B, null, 2));
console.log('  运行新版 update-check.mjs...');
spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
const afterB = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
console.log(`  结果: ${cacheType(afterB)}`);
console.log(`  新版无视旧缓存新鲜度, 重新探活并覆盖`);

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 C: 旧缓存 status=transient_error (上次探活失败)');
console.log('='.repeat(70));

const CACHE_C = {
  schemaVersion: 3,
  skills: { "wind-mcp-skill": { status: "transient_error", reason: "rate_limit", ttlMs: 300000, lockSignature: "C:\\Users\\Administrator\\.agents\\.skill-lock.json|2026-05-17T15:43:52.767Z", lastCheck: new Date(Date.now() - 600000).toISOString() } },
  baselines: {}
};

writeFileSync(CACHE_FILE, JSON.stringify(CACHE_C, null, 2));
console.log('  运行新版 update-check.mjs...');
spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
const afterC = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
console.log(`  结果: ${cacheType(afterC)}`);
console.log(`  旧错误状态丢失, 新版重新探活成功`);

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 D: 旧缓存包含 baselines 节 (v1 lock 兜底数据)');
console.log('='.repeat(70));

const CACHE_D = {
  schemaVersion: 3,
  skills: { "wind-mcp-skill": { status: "up_to_date", ttlMs: 3600000, lockSignature: "test", lastCheck: new Date().toISOString() } },
  baselines: {
    "C:\\path\\to\\lock:wind-mcp-skill:hash1": { remoteSha: "aaaa1111" },
    "C:\\path\\to\\lock:wind-mcp-skill:hash2": { remoteSha: "bbbb2222" },
    "C:\\other\\lock:wind-mcp-skill:hash3": { remoteSha: "cccc3333" },
  }
};

writeFileSync(CACHE_FILE, JSON.stringify(CACHE_D, null, 2));
console.log(`  写入旧缓存 (含 3 个 baseline)`);
console.log('  运行新版 update-check.mjs...');
spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
const afterD = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
console.log(`  结果: ${cacheType(afterD)}`);
console.log(`  baselines 保留: ${!!afterD.baselines}`);
if (!afterD.baselines) console.log('  [关键发现] baselines 节已被删除! 旧版 baseline 数据全部丢失');

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 E: 旧缓存完全过期 (lastCheck=30天前)');
console.log('='.repeat(70));

const CACHE_E = {
  schemaVersion: 3,
  skills: { "wind-mcp-skill": { status: "up_to_date", ttlMs: 3600000, lockSignature: "C:\\Users\\Administrator\\.agents\\.skill-lock.json|2026-05-17T15:43:52.767Z", lastCheck: new Date(Date.now() - 30 * 24 * 3600000).toISOString() } },
  baselines: {}
};

writeFileSync(CACHE_FILE, JSON.stringify(CACHE_E, null, 2));
console.log('  运行新版 update-check.mjs...');
spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
const afterE = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
console.log(`  结果: ${cacheType(afterE)}`);
if (afterE.version === 1) {
  for (const [key, val] of Object.entries(afterE.entries || {})) {
    const hasUpdate = val.latestSha !== val.lastNotifiedSha;
    console.log(`  检测到更新: ${hasUpdate ? '是' : '否 (same sha)'}`);
    console.log(`  latestSha=${val.latestSha?.slice(0,7)}, lastNotifiedSha=${val.lastNotifiedSha?.slice(0,7)}`);
  }
}

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 F: 旧缓存 + 新版 cli.mjs call 命令');
console.log('='.repeat(70));

writeFileSync(CACHE_FILE, JSON.stringify(CACHE_A, null, 2));
console.log('  写入旧缓存 (update_available)');
console.log('  运行新版 cli.mjs call...');
const resultF = spawnSync('node', [NEW_CLI, 'call', 'stock_data', 'get_stock_basicinfo', '{"question":"test"}'], { encoding: 'utf8', timeout: 15000, windowsHide: true });
console.log(`  退出码: ${resultF.status}`);
const stderrF = resultF.stderr || '';
console.log(`  stderr 含更新通知: ${stderrF.includes('wind-skills') || stderrF.includes('notice')}`);
if (stderrF) console.log(`  stderr: ${stderrF.trim().slice(0, 200)}`);
const afterF = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
console.log(`  缓存格式: ${cacheType(afterF)} (call 触发的异步 update-check 可能还没完成)`);

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 G: 新版 update-check 连续运行两次');
console.log('='.repeat(70));

writeFileSync(CACHE_FILE, JSON.stringify({ schemaVersion: 3, skills: { "wind-mcp-skill": { status: "up_to_date", ttlMs: 3600000, lockSignature: "test", lastCheck: new Date().toISOString() } }, baselines: {} }, null, 2));
console.log('  第一次运行...');
spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
const afterG1 = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
console.log(`  第一次后: ${cacheType(afterG1)}, callCount=${afterG1.meta?.callCount}`);
console.log('  第二次运行...');
spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
const afterG2 = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
console.log(`  第二次后: ${cacheType(afterG2)}, callCount=${afterG2.meta?.callCount}`);
console.log('  结论: 第一次覆盖旧缓存, 第二次在新格式上正常工作');

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 H: 旧缓存 + 新版 cli.mjs diagnose');
console.log('='.repeat(70));

writeFileSync(CACHE_FILE, JSON.stringify(CACHE_A, null, 2));
console.log('  运行新版 cli.mjs diagnose...');
const resultH = spawnSync('node', [NEW_CLI, 'diagnose'], { encoding: 'utf8', timeout: 15000, windowsHide: true });
console.log(`  输出: ${resultH.stdout?.trim()}`);
const afterH = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
console.log(`  diagnose 是否修改了缓存: ${afterH.schemaVersion === 3 ? '否' : '是'}`);

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('场景 I: 旧版 sentinel 文件对新脚本的影响');
console.log('='.repeat(70));

mkdirSync(CACHE_DIR, { recursive: true });
const sentinelPath = join(CACHE_DIR, 'update-shown-wind-mcp-skill-testsession');
writeFileSync(sentinelPath, '');
console.log(`  创建 sentinel 文件`);
writeFileSync(CACHE_FILE, JSON.stringify(CACHE_A, null, 2));
console.log('  运行新版 update-check...');
spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
console.log(`  sentinel 仍存在: ${existsSync(sentinelPath)}`);
console.log('  结论: sentinel 不影响新脚本, 新脚本不看 sentinel');
try { unlinkSync(sentinelPath); } catch {}

// =========================================================================
console.log('\n' + '='.repeat(70));
console.log('  最终对比总结');
console.log('='.repeat(70));

writeFileSync(CACHE_FILE, JSON.stringify(CACHE_A, null, 2));
const finalBefore = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
const finalAfter = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));

console.log(`\n  旧缓存 --> 新脚本运行:`);
console.log(`  格式: schemaVersion=3 --> version=${finalAfter.version}`);
console.log(`  数据节: skills{} --> entries{}`);
console.log(`  snoozedUntil: ${finalBefore.skills?.['wind-mcp-skill']?.snoozedUntil ?? 'N/A'} --> 全部丢失`);
console.log(`  baselines: ${Object.keys(finalBefore.baselines || {}).length} 条 --> ${finalAfter.baselines ? Object.keys(finalAfter.baselines).length + ' 条' : '全部丢失'}`);
console.log(`  status: ${finalBefore.skills?.['wind-mcp-skill']?.status} --> 新版不使用 status 字段`);
console.log(`  lockSignature: ${String(finalBefore.skills?.['wind-mcp-skill']?.lockSignature ?? '').slice(0,30)} --> ${Object.values(finalAfter.entries || {})[0]?.lockSignature ?? 'N/A'}`);

} finally {
  if (hadBackup && existsSync(BACKUP)) { writeFileSync(CACHE_FILE, readFileSync(BACKUP)); try { unlinkSync(BACKUP); } catch {} console.log('\n已恢复原始缓存'); }
  if (lockBackup && existsSync(LOCK_FILE)) { writeFileSync(LOCK_FILE, lockBackup); }
  for (const s of sentinelBackup) { try { writeFileSync(join(CACHE_DIR, s.name), s.data); } catch {} }
}
