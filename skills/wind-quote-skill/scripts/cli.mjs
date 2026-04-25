#!/usr/bin/env node
// wind-quote-skill · v0.2.0
// 专题 skill：1:1 包装 vserver_wind_quote MCP server
// 两命令：list-tools / call <tool_name> <params_json>

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_VERSION = '0.2.0';
const MCP_ENDPOINT = 'https://mcp.wind.com.cn/vserver_wind_quote/mcp/';
const SERVER_ID = 'wind-quote';

const SKILL_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const CACHE_DIR = join(homedir(), '.cache', 'wind-aimarket', 'tools');
const TOOLS_CACHE = join(CACHE_DIR, `${SERVER_ID}.json`);
const TTL_MS = 24 * 60 * 60 * 1000;

// ───── 工具函数 ─────

function die(msg, code = 1) {
  process.stderr.write(msg + '\n');
  process.exit(code);
}

function maskKey(key) {
  if (!key || key.length < 8) return '***';
  return key.slice(0, 4) + '***' + key.slice(-4);
}

function fresh(path) {
  if (!existsSync(path)) return false;
  return Date.now() - statSync(path).mtimeMs < TTL_MS;
}

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

// ───── 认证（三级兜底：env > skill config > 全局 config）─────

function getApiKey() {
  if (process.env.WIND_API_KEY) return process.env.WIND_API_KEY;

  const localConfig = join(SKILL_DIR, 'config.json');
  if (existsSync(localConfig)) {
    try {
      const cfg = JSON.parse(readFileSync(localConfig, 'utf8'));
      if (cfg.wind_api_key) return cfg.wind_api_key;
    } catch {}
  }

  const globalConfig = join(homedir(), '.wind-aimarket', 'config');
  if (existsSync(globalConfig)) {
    const m = readFileSync(globalConfig, 'utf8').match(/WIND_API_KEY=(\S+)/);
    if (m) return m[1];
  }

  die(
    `❌ WIND_API_KEY 未配置。请任选一种配置：\n` +
    `  A. export WIND_API_KEY=ak_xxx\n` +
    `  B. echo '{"wind_api_key":"ak_xxx"}' > ~/.claude/skills/wind-quote-skill/config.json\n` +
    `  C. mkdir -p ~/.wind-aimarket && echo "WIND_API_KEY=ak_xxx" > ~/.wind-aimarket/config  (推荐：所有 wind skill 共享)\n\n` +
    `获取 Key: https://aimarket.wind.com.cn → 登录 → 开发者中心`
  );
}

// ───── MCP 调用（裸 HTTP + JSON-RPC + SSE 拆包）─────

function parseSSE(text) {
  const lines = text.split(/\r?\n/);
  let last = null;
  for (const line of lines) {
    if (line.startsWith('data: ')) last = line.slice(6);
  }
  if (!last) throw new Error(`响应无 data 行，原文前 200 字符：${text.slice(0, 200)}`);
  return JSON.parse(last);
}

async function mcpRequest(method, params, { timeoutMs = 60_000 } = {}) {
  const apiKey = getApiKey();
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json, text/event-stream',
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });
  let resp;
  try {
    resp = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    die(
      `❌ MCP 网络异常：${err.message}\n` +
      `endpoint: ${MCP_ENDPOINT}\n` +
      `api key: ${maskKey(apiKey)}\n` +
      `可能原因：网络不通 / DNS / 代理拦截`
    );
  }

  if (!resp.ok) {
    const hint =
      resp.status === 401 || resp.status === 403
        ? `API Key 无效或过期 → 开发者中心重新生成`
        : resp.status >= 500
        ? `服务端异常 → 稍后重试或查 status.wind.com.cn`
        : `检查参数构造`;
    die(`❌ MCP HTTP ${resp.status} ${resp.statusText}\n提示：${hint}\napi key: ${maskKey(apiKey)}`);
  }

  const text = await resp.text();
  let payload;
  try {
    payload = parseSSE(text);
  } catch (err) {
    die(`❌ MCP 响应解析失败：${err.message}`);
  }
  if (payload.error) die(`❌ MCP 协议错误：${JSON.stringify(payload.error)}`);
  return payload.result;
}

async function mcpInitializeAndCall(method, params) {
  await mcpRequest('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'wind-quote-skill', version: SKILL_VERSION },
  }, { timeoutMs: 30_000 });

  return mcpRequest(method, params, { timeoutMs: 600_000 });
}

// ───── 命令 ─────

async function cmdListTools() {
  if (fresh(TOOLS_CACHE)) {
    const result = JSON.parse(readFileSync(TOOLS_CACHE, 'utf8'));
    console.log(JSON.stringify({ ok: true, from_cache: true, ...result }, null, 2));
    return;
  }

  const result = await mcpInitializeAndCall('tools/list', {});
  ensureDir(CACHE_DIR);
  writeFileSync(TOOLS_CACHE, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ok: true, from_cache: false, ...result }, null, 2));
}

async function cmdCall(toolName, paramsJson) {
  if (!toolName || !paramsJson) {
    die(`❌ 用法：call <tool_name> <params_json>\n例：call quote_get_indicators '{"windcode":"600519.SH","indexes":"NAME,MATCH"}'`);
  }

  let args;
  try {
    args = JSON.parse(paramsJson);
  } catch (e) {
    die(`❌ params JSON 解析失败：${e.message}\n原文：${paramsJson}`);
  }

  const result = await mcpInitializeAndCall('tools/call', {
    name: toolName,
    arguments: args,
  });
  console.log(JSON.stringify({ ok: true, tool: toolName, ...result }, null, 2));
}

// ───── 主入口 ─────

const [cmd, ...args] = process.argv.slice(2);

const USAGE =
  `wind-quote-skill v${SKILL_VERSION}\n` +
  `专注 Wind 行情查询（MCP server: ${SERVER_ID}）\n\n` +
  `用法：\n` +
  `  cli.mjs list-tools\n` +
  `  cli.mjs call <tool_name> '<params_json>'\n\n` +
  `先 list-tools 看可用工具，再 call 执行。\n` +
  `典型：cli.mjs call quote_get_indicators '{"windcode":"600519.SH","indexes":"NAME,MATCH,CHANGERANGE"}'`;

const commands = {
  'list-tools': () => cmdListTools(),
  call: () => cmdCall(args[0], args[1]),
};

if (!cmd || !commands[cmd]) {
  process.stderr.write(USAGE + '\n');
  process.exit(cmd ? 1 : 0);
}

commands[cmd]().catch((err) => {
  die(`❌ 执行失败：${err.stack || err.message || err}`);
});
