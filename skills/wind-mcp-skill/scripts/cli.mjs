#!/usr/bin/env node
// wind-mcp-skill · v1.2.0
// 万得 MCP 数据桥接：5 个 MCP server（fund_data / financial_docs / stock_data / economic_data / analytics_data）
// 统一调用入口 call(server_type, tool_name, params)，server_type 可扩展

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const SKILL_VERSION = '1.2.0';

const SERVERS = {
  fund_data: {
    endpoint: 'https://mcp.wind.com.cn/vserver_fund_data/mcp/',
    cache_id: 'wind-fund-data',
    label: 'Wind 基金（档案/持仓/业绩/持有人/财务/管理人）',
  },
  financial_docs: {
    endpoint: 'https://mcp.wind.com.cn/vserver_financial_docs/mcp/',
    cache_id: 'wind-financial-docs',
    label: 'Wind 金融文档 RAG（公告 / 新闻）',
  },
  stock_data: {
    endpoint: 'https://mcp.wind.com.cn/vserver_stock_data/mcp/',
    cache_id: 'wind-stock-data',
    label: 'Wind 股票（档案/财务/股本/事件/技术指标/风险）',
  },
  economic_data: {
    endpoint: 'https://mcp.wind.com.cn/vserver_economic_data/mcp/',
    cache_id: 'wind-economic-data',
    label: 'Wind EDB 宏观/行业经济指标',
  },
  analytics_data: {
    endpoint: 'https://mcp.wind.com.cn/vserver_analytics_data/mcp/',
    cache_id: 'wind-analytics-data',
    label: 'Wind 通用分析数据（NL → Wind 数据）',
  },
};

const PORTAL_URL = 'https://aimarket.wind.com.cn/#/user/overview';

const SKILL_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const CACHE_DIR = join(homedir(), '.cache', 'wind-aimarket', 'tools');
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

function getServer(server_type) {
  const server = SERVERS[server_type];
  if (!server) {
    die(
      `❌ 未知 server_type: ${server_type}\n` +
      `可用: ${Object.keys(SERVERS).join(' / ')}`
    );
  }
  return server;
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
    `❌ WIND_API_KEY 未配置。\n\n` +
    `获取 Key（推荐先问用户是否同意，再帮他打开浏览器）：\n` +
    `  $ node ${join(SKILL_DIR, 'scripts', 'cli.mjs')} open-portal\n` +
    `或手动访问：${PORTAL_URL}（未登录会自动跳到 /#/login）\n\n` +
    `拿到 Key 后任选一种方式配置：\n` +
    `  A. export WIND_API_KEY=ak_xxx\n` +
    `  B. echo '{"wind_api_key":"ak_xxx"}' > ${join(SKILL_DIR, 'config.json')}\n` +
    `  C. mkdir -p ~/.wind-aimarket && echo "WIND_API_KEY=ak_xxx" > ~/.wind-aimarket/config  (推荐：所有 wind skill 共享)`
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

async function mcpRequest(server_type, method, params, { timeoutMs = 60_000 } = {}) {
  const server = getServer(server_type);
  const apiKey = getApiKey();
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json, text/event-stream',
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });
  let resp;
  try {
    resp = await fetch(server.endpoint, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    die(
      `❌ MCP 网络异常：${err.message}\n` +
      `server_type: ${server_type}\n` +
      `endpoint: ${server.endpoint}\n` +
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
    die(`❌ MCP HTTP ${resp.status} ${resp.statusText}\nserver_type: ${server_type}\n提示：${hint}\napi key: ${maskKey(apiKey)}`);
  }

  const text = await resp.text();
  let payload;
  try {
    payload = parseSSE(text);
  } catch (err) {
    die(`❌ MCP 响应解析失败 (${server_type})：${err.message}`);
  }
  if (payload.error) die(`❌ MCP 协议错误 (${server_type})：${JSON.stringify(payload.error)}`);
  return payload.result;
}

async function mcpInitializeAndCall(server_type, method, params) {
  await mcpRequest(server_type, 'initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'wind-mcp-skill', version: SKILL_VERSION },
  }, { timeoutMs: 30_000 });

  return mcpRequest(server_type, method, params, { timeoutMs: 600_000 });
}

// ───── 命令 ─────

async function cmdListTools(server_type) {
  if (!server_type) {
    die(
      `❌ 用法：list-tools <server_type>\n` +
      `可用 server_type: ${Object.keys(SERVERS).join(' / ')}`
    );
  }
  const server = getServer(server_type);
  const cacheFile = join(CACHE_DIR, `${server.cache_id}.json`);

  if (fresh(cacheFile)) {
    const result = JSON.parse(readFileSync(cacheFile, 'utf8'));
    console.log(JSON.stringify({ ok: true, server_type, from_cache: true, ...result }, null, 2));
    return;
  }

  const result = await mcpInitializeAndCall(server_type, 'tools/list', {});
  ensureDir(CACHE_DIR);
  writeFileSync(cacheFile, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ok: true, server_type, from_cache: false, ...result }, null, 2));
}

async function cmdCall(server_type, toolName, paramsJson) {
  if (!server_type || !toolName || !paramsJson) {
    die(
      `❌ 用法：call <server_type> <tool_name> '<params_json>'\n` +
      `可用 server_type: ${Object.keys(SERVERS).join(' / ')}\n` +
      `例：\n` +
      `  call analytics_data get_financial_data '{"question":"贵州茅台 2024 年 ROE"}'\n` +
      `  call stock_data get_stock_basicinfo '{"question":"600519.SH 公司基本档案"}'\n` +
      `  call fund_data get_fund_info '{"question":"005827.OF 基金档案"}'\n` +
      `  call financial_docs get_financial_news '{"query":"美联储利率政策","top_k":3}'\n` +
      `  call economic_data get_economic_data '{"metricIdsStr":"中国GDP"}'`
    );
  }

  let args;
  try {
    args = JSON.parse(paramsJson);
  } catch (e) {
    die(`❌ params JSON 解析失败：${e.message}\n原文：${paramsJson}`);
  }

  const result = await mcpInitializeAndCall(server_type, 'tools/call', {
    name: toolName,
    arguments: args,
  });
  console.log(JSON.stringify({ ok: true, server_type, tool: toolName, ...result }, null, 2));
}

async function cmdOpenPortal() {
  const platform = process.platform;
  let bin, args;
  if (platform === 'darwin') { bin = 'open'; args = [PORTAL_URL]; }
  else if (platform === 'win32') { bin = 'cmd'; args = ['/c', 'start', '', PORTAL_URL]; }
  else { bin = 'xdg-open'; args = [PORTAL_URL]; }

  let spawnError = null;
  try {
    const child = spawn(bin, args, { stdio: 'ignore', detached: true });
    child.unref();
    spawnError = await new Promise((resolve) => {
      child.once('error', resolve);
      setTimeout(() => resolve(null), 300);
    });
  } catch (err) {
    spawnError = err;
  }

  const result = {
    ok: !spawnError,
    action: 'open-portal',
    url: PORTAL_URL,
    platform,
    spawn_command: `${bin} ${args.join(' ')}`,
    flow_note: '未登录时会自动跳转到登录页（/#/login）；登录完成后回到 overview 页面即可获取 API Key。',
    fallback_message: `如果浏览器没有自动弹出，请手动访问：${PORTAL_URL}`,
  };
  if (spawnError) {
    result.error = spawnError.message;
    result.headless_hint = '本地无法启动浏览器（headless / 无 GUI / 命令不存在）。请把 url 字段告知用户，让他在自己设备的浏览器里打开。';
  }
  console.log(JSON.stringify(result, null, 2));
}

// ───── 主入口 ─────

const [cmd, ...args] = process.argv.slice(2);

const USAGE =
  `wind-mcp-skill v${SKILL_VERSION}\n` +
  `万得 MCP 数据桥接: 5 server / 16 工具（按 server_type 路由）\n\n` +
  `用法:\n` +
  `  cli.mjs list-tools <server_type>\n` +
  `  cli.mjs call <server_type> <tool_name> '<params_json>'\n` +
  `  cli.mjs open-portal                       # 打开万得开发者中心拿 API Key\n\n` +
  `可用 server_type:\n` +
  Object.entries(SERVERS).map(([k, v]) => `  ${k.padEnd(20)}${v.label}`).join('\n') + '\n\n' +
  `典型:\n` +
  `  cli.mjs list-tools fund_data\n` +
  `  cli.mjs call analytics_data get_financial_data '{"question":"贵州茅台 2024 年 ROE"}'\n` +
  `  cli.mjs call stock_data get_stock_basicinfo '{"question":"600519.SH 公司基本档案"}'\n` +
  `  cli.mjs call fund_data get_fund_holdings '{"question":"005827.OF 最新一期重仓股"}'`;

const commands = {
  'list-tools': () => cmdListTools(args[0]),
  call: () => cmdCall(args[0], args[1], args[2]),
  'open-portal': () => cmdOpenPortal(),
};

if (!cmd || !commands[cmd]) {
  process.stderr.write(USAGE + '\n');
  process.exit(cmd ? 1 : 0);
}

commands[cmd]().catch((err) => {
  die(`❌ 执行失败：${err.stack || err.message || err}`);
});
