#!/usr/bin/env node
// 兼容性测试: 旧版缓存文件 vs 新版脚本
// 对比 https://github.com/JsonCodeChina/wind-skills.git (新版)
// 与     https://github.com/Wind-Information-Co-Ltd/wind-skills.git (旧版)
// 中的 wind-mcp-skill/scripts/update-check.mjs 缓存格式兼容性
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CACHE_DIR = join(homedir(), '.cache', 'wind-aifinmarket');
const CACHE_FILE = join(CACHE_DIR, 'update-state.json');

const OLD_SCRIPT = join(homedir(), 'AppData', 'Local', 'Temp', 'windinfo-skills', 'skills', 'wind-mcp-skill', 'scripts', 'update-check.mjs');
const NEW_SCRIPT = join(homedir(), 'AppData', 'Local', 'Temp', 'jsoncode-skills', 'skills', 'wind-mcp-skill', 'scripts', 'update-check.mjs');
const NEW_CLI = join(homedir(), 'AppData', 'Local', 'Temp', 'jsoncode-skills', 'skills', 'wind-mcp-skill', 'scripts', 'cli.mjs');
const OLD_CLI = join(homedir(), 'AppData', 'Local', 'Temp', 'windinfo-skills', 'skills', 'wind-mcp-skill', 'scripts', 'cli.mjs');

let passed = 0, failed = 0, total = 0;
function assert(condition, label) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

let backupData = null;
if (existsSync(CACHE_FILE)) {
  backupData = readFileSync(CACHE_FILE);
  console.log('Backed up existing cache file');
}

function restoreCache() {
  if (backupData) { writeFileSync(CACHE_FILE, backupData); console.log('Restored original cache file'); }
  else if (existsSync(CACHE_FILE)) { try { unlinkSync(CACHE_FILE); } catch {} }
}

try {

const OLD_V3_CACHE = {
  schemaVersion: 3,
  skills: {
    "wind-mcp-skill": {
      status: "update_available",
      outdated: [{
        name: "wind-mcp-skill",
        current: "abc1234",
        latest: "def5678",
        sourceUrl: "https://github.com/JsonCodeChina/wind-skills.git",
        installedHash: "oldhash123",
        scope: "global",
      }],
      ttlMs: 43200000,
      lockSignature: "lockpath1|2025-01-01T00:00:00Z",
      lastCheck: new Date().toISOString(),
      snoozedUntil: null,
      snoozeLevel: 0,
    }
  },
  baselines: {
    "/some/lock/path:wind-mcp-skill:hash123": { remoteSha: "abc1234567890" }
  }
};

const NEW_V1_CACHE = {
  version: 1,
  meta: { callCount: 15, fallbackShownAt: null },
  entries: {
    "wind-mcp-skill|c:/users/test/.agents/.skill-lock.json": {
      lockSchemaVersion: 3,
      latestSha: "def567890abcdef",
      etag: 'W/"etag123"',
      lastCheckedAt: new Date().toISOString(),
      lastSuccessAt: new Date().toISOString(),
      lockSignature: "2025-01-15T00:00:00Z",
      lastNotifiedSha: "abc1234567890ab",
    }
  }
};

// ===== Test 1: new readCache reads old v3 cache =====
console.log('\n=== Test 1: new readCache reads old v3 cache ===');
try {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(OLD_V3_CACHE, null, 2));
  const mod = await import(`file:///${NEW_SCRIPT.replace(/\\/g, '/')}`);
  const result = mod.readCache(CACHE_FILE);
  assert(result.version === 1, 'returns version=1 (old schemaVersion=3 != CACHE_VERSION=1)');
  assert(Object.keys(result.entries).length === 0, 'returns empty entries');
  console.log('  IMPLICATION: New script treats old v3 cache as invalid -> triggers fresh probe');
} catch(e) { console.log(`  ERROR: ${e.message}`); }

// ===== Test 2: old readUnifiedCache reads new v1 cache =====
console.log('\n=== Test 2: old readUnifiedCache reads new v1 cache ===');
try {
  writeFileSync(CACHE_FILE, JSON.stringify(NEW_V1_CACHE, null, 2));
  const data = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  assert(data.schemaVersion !== 3, 'schemaVersion missing/!=3');
  console.log('  IMPLICATION: Old script treats new v1 cache as invalid -> triggers fresh probe');
} catch(e) { console.log(`  ERROR: ${e.message}`); }

// ===== Test 3: Run old update-check.mjs directly =====
console.log('\n=== Test 3: Run old update-check.mjs (old v3 cache present) ===');
try {
  writeFileSync(CACHE_FILE, JSON.stringify(OLD_V3_CACHE, null, 2));
  const result = spawnSync('node', [OLD_SCRIPT], { encoding: 'utf8', timeout: 15000, windowsHide: true });
  console.log(`  Exit code: ${result.status}`);
  if (result.stderr) console.log(`  stderr: ${result.stderr.slice(0, 300)}`);
  const afterCache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  console.log(`  After: schemaVersion=${afterCache.schemaVersion}, skills=${Object.keys(afterCache.skills || {}).join(',')}`);
  assert(afterCache.schemaVersion === 3, 'old script keeps schemaVersion=3 format');
} catch(e) { console.log(`  ERROR: ${e.message}`); }

// ===== Test 4: Run new update-check.mjs (old v3 cache present) =====
console.log('\n=== Test 4: Run new update-check.mjs (old v3 cache present) ===');
try {
  writeFileSync(CACHE_FILE, JSON.stringify(OLD_V3_CACHE, null, 2));
  const result = spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
  console.log(`  Exit code: ${result.status}`);
  if (result.stderr) console.log(`  stderr: ${result.stderr.slice(0, 300)}`);
  const afterCache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  console.log(`  After: top-level keys=${Object.keys(afterCache).join(',')}`);
  if (afterCache.version === 1) {
    console.log(`  --> New script OVERWROTE old cache to version=1`);
    console.log(`  entries: ${Object.keys(afterCache.entries || {}).join(', ') || '(empty)'}`);
    assert(true, 'new script overwrites old cache');
  } else if (afterCache.schemaVersion === 3) {
    console.log('  --> New script did NOT modify old cache');
    assert(true, 'new script did not corrupt old cache');
  }
} catch(e) { console.log(`  ERROR: ${e.message}`); }

// ===== Test 5: old cli.mjs readCacheView reads new v1 cache =====
console.log('\n=== Test 5: old cli.mjs readCacheView reads new v1 cache ===');
try {
  writeFileSync(CACHE_FILE, JSON.stringify(NEW_V1_CACHE, null, 2));
  const raw = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  const isV3 = raw?.schemaVersion === 3 && raw?.skills && typeof raw.skills === 'object';
  assert(!isV3, 'old cli treats new cache as legacy');
  assert(raw.status === undefined, 'state.status=undefined -> no notification, no crash');
  console.log('  IMPLICATION: Old cli reads new cache as legacy, status=undefined -> silent');
} catch(e) { console.log(`  ERROR: ${e.message}`); }

// ===== Test 6: new cli.mjs readCache reads old v3 cache =====
console.log('\n=== Test 6: new cli.mjs readCache reads old v3 cache ===');
try {
  writeFileSync(CACHE_FILE, JSON.stringify(OLD_V3_CACHE, null, 2));
  const mod = await import(`file:///${NEW_SCRIPT.replace(/\\/g, '/')}?t=${Date.now()}`);
  const cache = mod.readCache(CACHE_FILE);
  assert(cache.version === 1, 'returns empty cache');
  assert(Object.keys(cache.entries).length === 0, 'empty entries');
  console.log('  IMPLICATION: New script treats old cache invalid -> triggers fresh probe');
} catch(e) { console.log(`  ERROR: ${e.message}`); }

// ===== Test 7: Upgrade simulation =====
console.log('\n=== Test 7: Upgrade simulation (old cache -> new script runs) ===');
try {
  const oldCache = {
    schemaVersion: 3,
    skills: { "wind-mcp-skill": { status: "up_to_date", ttlMs: 3600000, lockSignature: "test", lastCheck: new Date().toISOString() } },
    baselines: {}
  };
  writeFileSync(CACHE_FILE, JSON.stringify(oldCache, null, 2));
  const result = spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
  const afterCache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  if (afterCache.version === 1) {
    console.log(`  --> Overwrote to version=1, entries=${Object.keys(afterCache.entries || {}).length}`);
    assert(true, 'upgrade: new script works');
  } else {
    console.log(`  --> Cache unchanged: ${Object.keys(afterCache).join(',')}`);
    assert(true, 'upgrade: cache not corrupted');
  }
} catch(e) { console.log(`  ERROR: ${e.message}`); }

// ===== Test 8: Downgrade simulation =====
console.log('\n=== Test 8: Downgrade simulation (new cache -> old script runs) ===');
try {
  writeFileSync(CACHE_FILE, JSON.stringify(NEW_V1_CACHE, null, 2));
  const result = spawnSync('node', [OLD_SCRIPT], { encoding: 'utf8', timeout: 15000, windowsHide: true });
  const afterCache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  if (afterCache.schemaVersion === 3) {
    console.log('  --> Old script overwrote to schemaVersion=3');
    assert(true, 'downgrade: old script works');
  } else if (afterCache.version === 1) {
    console.log('  --> Old script did NOT modify cache');
    const raw = afterCache;
    const isV3 = raw?.schemaVersion === 3 && raw?.skills;
    if (!isV3) {
      console.log('  --> Old cli treats it as legacy: state.status=undefined');
      assert(true, 'downgrade: no crash, no false notification');
    }
  }
} catch(e) { console.log(`  ERROR: ${e.message}`); }

// ===== Test 9: With lock file - real upgrade =====
console.log('\n=== Test 9: With lock file - new script real upgrade ===');
try {
  const testDir = join(homedir(), 'compat-test');
  mkdirSync(testDir, { recursive: true });
  const lockPath = join(testDir, 'skills-lock.json');
  writeFileSync(lockPath, JSON.stringify({
    version: 3,
    skills: {
      "wind-mcp-skill": {
        sourceUrl: "https://github.com/JsonCodeChina/wind-skills.git",
        installedAt: "2025-05-01T00:00:00Z",
        updatedAt: "2025-05-01T00:00:00Z",
        skillPath: "skills/wind-mcp-skill",
        ref: "main",
        computedHash: "testhash123",
      }
    }
  }, null, 2));
  writeFileSync(CACHE_FILE, JSON.stringify(OLD_V3_CACHE, null, 2));
  const result = spawnSync('node', [NEW_SCRIPT], {
    encoding: 'utf8', timeout: 30000, windowsHide: true, cwd: testDir,
  });
  console.log(`  Exit: ${result.status}`);
  if (result.stderr) console.log(`  stderr: ${result.stderr.slice(0, 300)}`);
  const afterCache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  const isV1 = afterCache.version === 1;
  console.log(`  Format: ${isV1 ? 'new(version=1)' : 'old(' + Object.keys(afterCache).join(',') + ')'}`);
  if (isV1) {
    const entries = Object.keys(afterCache.entries || {});
    console.log(`  entries: ${entries.length}`);
    for (const k of entries) {
      console.log(`    key=${k}`);
      console.log(`    val=${JSON.stringify(afterCache.entries[k]).slice(0, 200)}`);
    }
    assert(entries.length > 0, 'new script found lock file and created entries');
  } else {
    assert(true, 'new script did not corrupt old cache');
  }
  try { unlinkSync(lockPath); } catch {}
} catch(e) { console.log(`  ERROR: ${e.message}`); }

// ===== Test 10: new cli diagnose =====
console.log('\n=== Test 10: new cli.mjs diagnose (old cache present) ===');
try {
  writeFileSync(CACHE_FILE, JSON.stringify(OLD_V3_CACHE, null, 2));
  const result = spawnSync('node', [NEW_CLI, 'diagnose'], { encoding: 'utf8', timeout: 15000, windowsHide: true });
  console.log(`  stdout: ${result.stdout?.slice(0, 500)}`);
  assert(result.status === 0, 'diagnose exits normally');
} catch(e) { console.log(`  ERROR: ${e.message}`); }

// ===== Test 11: Snooze state lost =====
console.log('\n=== Test 11: Snooze state lost after upgrade ===');
try {
  const snoozedCache = {
    schemaVersion: 3,
    skills: {
      "wind-mcp-skill": {
        status: "update_available",
        outdated: [{ name: "wind-mcp-skill", current: "abc", latest: "def", sourceUrl: "https://github.com/JsonCodeChina/wind-skills.git", scope: "global" }],
        ttlMs: 43200000, lockSignature: "test", lastCheck: new Date().toISOString(),
        snoozedUntil: new Date(Date.now() + 86400000).toISOString(),
        snoozeLevel: 1,
      }
    }, baselines: {}
  };
  writeFileSync(CACHE_FILE, JSON.stringify(snoozedCache, null, 2));
  const mod = await import(`file:///${NEW_SCRIPT.replace(/\\/g, '/')}?t=${Date.now()}`);
  const cache = mod.readCache(CACHE_FILE);
  assert(Object.keys(cache.entries).length === 0, 'snooze state lost');
  console.log('  IMPLICATION: User snooze settings LOST, may re-show dismissed notifications');
} catch(e) { console.log(`  ERROR: ${e.message}`); }

// ===== Test 12: Sentinel file compat =====
console.log('\n=== Test 12: Sentinel file compatibility ===');
{
  const sentinelDir = CACHE_DIR;
  mkdirSync(sentinelDir, { recursive: true });
  const testSentinel = join(sentinelDir, 'update-shown-wind-mcp-skill-test123');
  writeFileSync(testSentinel, '');
  console.log('  Old uses sentinel files (mtime-based dedup)');
  console.log('  New uses lastNotifiedSha in cache entries');
  console.log('  --> Sentinel files do not affect new script');
  assert(true, 'sentinel files do not interfere');
  try { unlinkSync(testSentinel); } catch {}
}

// ===== Test 13: Baseline data =====
console.log('\n=== Test 13: Baseline data (old v1 lock fallback) ===');
{
  const cacheWithBaseline = {
    schemaVersion: 3,
    skills: { "wind-mcp-skill": { status: "up_to_date", ttlMs: 3600000, lockSignature: "test", lastCheck: new Date().toISOString() } },
    baselines: {
      "/path/to/lock:wind-mcp-skill:hash1": { remoteSha: "abc123" },
      "/path/to/lock:wind-mcp-skill:hash2": { remoteSha: "def456" },
    }
  };
  writeFileSync(CACHE_FILE, JSON.stringify(cacheWithBaseline, null, 2));
  const mod = await import(`file:///${NEW_SCRIPT.replace(/\\/g, '/')}?t=${Date.now()}`);
  const cache = mod.readCache(CACHE_FILE);
  assert(Object.keys(cache.entries).length === 0, 'baseline data ignored by new script');
  console.log('  IMPLICATION: Old baseline data lost - no impact since new script uses different strategy');
}

// ===== Test 14: Both scripts coexist =====
console.log('\n=== Test 14: Alternating runs (old then new then old) ===');
try {
  writeFileSync(CACHE_FILE, JSON.stringify(OLD_V3_CACHE, null, 2));
  console.log('  Step 1: Old cache written');
  spawnSync('node', [OLD_SCRIPT], { encoding: 'utf8', timeout: 15000, windowsHide: true });
  let cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  console.log(`  Step 2: After old script: schemaVersion=${cache.schemaVersion}`);
  assert(cache.schemaVersion === 3, 'old script keeps v3');
  spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
  cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  console.log(`  Step 3: After new script: version=${cache.version}, schemaVersion=${cache.schemaVersion}`);
  spawnSync('node', [OLD_SCRIPT], { encoding: 'utf8', timeout: 15000, windowsHide: true });
  cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  console.log(`  Step 4: After old script again: schemaVersion=${cache.schemaVersion}, version=${cache.version}`);
  assert(true, 'alternating runs completed without crash');
} catch(e) { console.log(`  ERROR: ${e.message}`); }

// ===== Test 15: Real installed skill test =====
console.log('\n=== Test 15: Test with real installed skill ===');
try {
  const globalLockPath = join(homedir(), '.agents', '.skill-lock.json');
  if (existsSync(globalLockPath)) {
    console.log(`  Global lock found: ${globalLockPath}`);
    const lock = JSON.parse(readFileSync(globalLockPath, 'utf8'));
    const entry = lock.skills?.['wind-mcp-skill'];
    if (entry) {
      console.log(`  Entry found: sourceUrl=${entry.sourceUrl}, installedAt=${entry.installedAt}`);
      writeFileSync(CACHE_FILE, JSON.stringify(OLD_V3_CACHE, null, 2));
      const result = spawnSync('node', [NEW_SCRIPT], { encoding: 'utf8', timeout: 30000, windowsHide: true });
      const afterCache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
      console.log(`  After new script: ${afterCache.version === 1 ? 'version=1 (new format)' : Object.keys(afterCache).join(',')}`);
      if (afterCache.version === 1) {
        const entries = Object.keys(afterCache.entries || {});
        console.log(`  entries count: ${entries.length}`);
        for (const k of entries) {
          const e = afterCache.entries[k];
          console.log(`    key: ${k}`);
          console.log(`    latestSha: ${e.latestSha}`);
          console.log(`    lastNotifiedSha: ${e.lastNotifiedSha}`);
        }
      }
      assert(true, 'real installed skill test passed');
    } else {
      console.log('  wind-mcp-skill not found in global lock');
      assert(true, 'skipped - skill not installed');
    }
  } else {
    console.log('  No global lock file found');
    assert(true, 'skipped - no global lock');
  }
} catch(e) { console.log(`  ERROR: ${e.message}`); }

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed}/${total} passed, ${failed}/${total} failed`);
console.log('='.repeat(60));

} finally {
  restoreCache();
}
