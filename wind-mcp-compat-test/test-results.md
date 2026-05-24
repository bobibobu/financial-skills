# test-compat.mjs 运行结果 (2026-05-24)

```
=== Test 1: new readCache reads old v3 cache ===
  PASS: returns version=1 (old schemaVersion=3 != CACHE_VERSION=1)
  PASS: returns empty entries
  IMPLICATION: New script treats old v3 cache as invalid -> triggers fresh probe

=== Test 2: old readUnifiedCache reads new v1 cache ===
  PASS: schemaVersion missing/!=3
  IMPLICATION: Old script treats new v1 cache as invalid -> triggers fresh probe

=== Test 3: Run old update-check.mjs (old v3 cache present) ===
  Exit code: 0
  stderr: [wind-skills] 检测到 1 个 skill 有新版:  • wind-mcp-skill  9c67f63 → 694ddcf  升级: npx skills update wind-mcp-skill -g -y
  After: schemaVersion=3, skills=wind-mcp-skill
  PASS: old script keeps schemaVersion=3 format

=== Test 4: Run new update-check.mjs (old v3 cache present) ===
  Exit code: 0
  After: top-level keys=version,meta,entries
  --> New script OVERWROTE old cache to version=1
  entries: wind-mcp-skill|c:\users\administrator\.agents\.skill-lock.json
  PASS: new script overwrites old cache

=== Test 5: old cli.mjs readCacheView reads new v1 cache ===
  PASS: old cli treats new cache as legacy
  PASS: state.status=undefined -> no notification, no crash
  IMPLICATION: Old cli reads new cache as legacy, status=undefined -> silent

=== Test 6: new cli.mjs readCache reads old v3 cache ===
  PASS: returns empty cache
  PASS: empty entries
  IMPLICATION: New script treats old cache invalid -> triggers fresh probe

=== Test 7: Upgrade simulation (old cache -> new script runs) ===
  --> Overwrote to version=1, entries=1
  PASS: upgrade: new script works

=== Test 8: Downgrade simulation (new cache -> old script runs) ===
  --> Old script overwrote to schemaVersion=3
  PASS: downgrade: old script works

=== Test 9: With lock file - new script real upgrade ===
  Exit: 0
  Format: new(version=1)
  entries: 2
    key=wind-mcp-skill|c:\users\administrator\.agents\.skill-lock.json
    val={"lockSchemaVersion":3,"latestSha":"694ddcf16b72c99c1d364c62f7567d368cb60b5a",...}
    key=wind-mcp-skill|c:\users\administrator\compat-test\skills-lock.json
    val={"lockSchemaVersion":3,"latestSha":"a816156a5ba34e48332c840cab96232ceac5e919",...}
  PASS: new script found lock file and created entries

=== Test 10: new cli.mjs diagnose (old cache present) ===
  stdout: { "platform": "win32", "node_pid": 25336, "cache_file": "...", "cache_entries": [], "meta": {"callCount": 0} }
  PASS: diagnose exits normally

=== Test 11: Snooze state lost after upgrade ===
  PASS: snooze state lost
  IMPLICATION: User snooze settings LOST, may re-show dismissed notifications

=== Test 12: Sentinel file compatibility ===
  Old uses sentinel files (mtime-based dedup)
  New uses lastNotifiedSha in cache entries
  --> Sentinel files do not affect new script
  PASS: sentinel files do not interfere

=== Test 13: Baseline data (old v1 lock fallback) ===
  PASS: baseline data ignored by new script
  IMPLICATION: Old baseline data lost - no impact since new script uses different strategy

=== Test 14: Alternating runs (old then new then old) ===
  Step 1: Old cache written
  Step 2: After old script: schemaVersion=3
  PASS: old script keeps v3
  Step 3: After new script: version=1, schemaVersion=undefined
  Step 4: After old script again: schemaVersion=3, version=undefined
  PASS: alternating runs completed without crash

=== Test 15: Test with real installed skill ===
  Global lock found: C:\Users\Administrator\.agents\.skill-lock.json
  Lock version: 3
  Entry found: sourceUrl=https://github.com/Wind-Information-Co-Ltd/wind-skills.git, installedAt=2026-05-17T15:43:52.767Z
  After new script: version=1 (new format)
  entries count: 1
    key: wind-mcp-skill|c:\users\administrator\.agents\.skill-lock.json
    latestSha: 694ddcf16b72c99c1d364c62f7567d368cb60b5a
    lastNotifiedSha: 9c67f63f25fb3dd25fea170c01b5e7956c1e8d10
  PASS: real installed skill test passed

============================================================
Results: 19/19 passed, 0/19 failed
============================================================
```
