#!/usr/bin/env node
// wind-find-finance-skill · v0.1.0
// Meta-skill：读 llm-wiki 索引，帮 AI 命中对路的金融 skill
// 4 命令：list-capabilities / find-capability / read-doc / refresh-wiki

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_VERSION = '0.1.0';
const REMOTE_BASE = 'https://raw.githubusercontent.com/JsonCodeChina/wind-skills/main/skills/wind-find-finance-skill/references/wiki';
const SKILL_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const LOCAL_WIKI_DIR = join(SKILL_DIR, 'references', 'wiki');
const CACHE_DIR = join(homedir(), '.cache', 'wind-aimarket', 'wiki');
const TTL_MS = 24 * 60 * 60 * 1000;

// ───── 跨境市场识别（避免把美股 / 加密货币等查询错配到 A股/港股 skill）─────

const CROSS_BORDER_PATTERNS = [
  '美股', '美国股', '美国市场', '美元', '欧股', '日股', '英股', '台股',
  'tesla', 'apple', 'nvidia', 'microsoft', 'google', 'amazon', 'meta',
  '苹果', '特斯拉', '英伟达', '微软', '谷歌', '亚马逊',
  '标普', 's&p', 'sp500', 'sp 500', '纳斯达克', '纳指', '道指', '道琼斯', '罗素',
  '加密', '比特币', '以太坊', 'btc', 'eth', 'crypto', '数字货币',
  '美联储', 'fed', 'ecb', 'boj',
];

function detectCrossBorder(q) {
  const lower = q.toLowerCase();
  return CROSS_BORDER_PATTERNS.some(p => lower.includes(p.toLowerCase()));
}

// ───── 能力索引（硬编码，MVP 阶段维护，未来从 index.md 解析）─────

const CAPABILITY_INDEX = [
  // ── 已开放 Skills ──
  {
    path: 'skills/wind-quote-skill.md',
    type: 'skill',
    name: 'wind-quote-skill',
    coverage: 'open',
    markets: ['A股', '港股'],
    summary: 'A 股 / 港股实时行情 + K 线 + 分钟级 + 万得板块成分',
    keywords: ['行情', '报价', '最新价', '涨跌', '成交', 'K 线', 'K线', 'kline', '分钟', '板块', '成分', '万得板块', '行业板块', '概念板块', 'A 股', '港股', '股价'],
  },
  {
    path: 'skills/wind-financial-data-skill.md',
    type: 'skill',
    name: 'wind-financial-data-skill',
    coverage: 'open',
    markets: ['A股', '港股', '中国宏观'],
    summary: '财务基本面 + 估值倍数 + 宏观经济 + 公司文档（新闻 + 公告）',
    keywords: ['财务', '营收', '利润', '净利', '毛利', '资产', '负债', '现金流', 'ROE', 'ROA', 'PE', 'PB', 'PS', '估值', '市盈率', '市净率', '股息率', '宏观', 'GDP', 'CPI', 'PPI', '社融', 'M2', 'PMI', '利率', 'LPR', '国债', '财报', '增长率', '同比', '环比', '公告', '年报', '新闻', '招股书', '监管', 'ESG'],
  },
  // ── 已开放 Categories ──
  {
    path: 'categories/股票/基本资料.md',
    type: 'category',
    asset: '股票',
    sub: '基本资料',
    coverage: 'full',
    markets: ['A股', '港股'],
    summary: '股票静态属性：代码 / 名称 / 上市日期 / 总股本 / 行业归属',
    keywords: ['基本资料', '上市日期', '总股本', '流通股本', '行业归属', '注册地', '办公地', '所属板块'],
  },
  {
    path: 'categories/股票/行情.md',
    type: 'category',
    asset: '股票',
    sub: '行情',
    coverage: 'full',
    markets: ['A股', '港股'],
    summary: 'A 股 / 港股实时报价 / K 线 / 分钟 / 板块成分',
    keywords: ['行情', '报价', '最新价', '涨跌', '成交', 'K 线', 'K线', '分钟', '板块', '成分', '股价'],
  },
  {
    path: 'categories/股票/估值指标.md',
    type: 'category',
    asset: '股票',
    sub: '估值指标',
    coverage: 'full',
    markets: ['A股', '港股'],
    summary: 'PE / PB / PS / 股息率 / EV/EBITDA / 估值历史分位',
    keywords: ['估值', '市盈率', 'PE', '市净率', 'PB', '市销率', 'PS', '股息率', 'EV/EBITDA', '估值分位'],
  },
  {
    path: 'categories/股票/财务指标.md',
    type: 'category',
    asset: '股票',
    sub: '财务指标',
    coverage: 'full',
    markets: ['A股', '港股'],
    summary: '财报科目 + 财务比率 + 增长率 + 跨标的对比',
    keywords: ['财务', '营收', '营业收入', '利润', '净利', '毛利', '资产', '负债', '现金流', 'ROE', 'ROA', '资产负债率', '增长率', '同比', '环比', 'CAGR'],
  },
  {
    path: 'categories/股票/ESG.md',
    type: 'category',
    asset: '股票',
    sub: 'ESG',
    coverage: 'partial',
    markets: ['A股', '港股'],
    summary: 'ESG 评分（实测覆盖度确认中）',
    keywords: ['ESG', '环境', '社会', '治理', 'ESG 评分'],
  },
  {
    path: 'categories/宏观经济.md',
    type: 'category',
    asset: '宏观经济',
    coverage: 'full',
    markets: ['中国宏观'],
    summary: '中国宏观：GDP / CPI / 社融 / 利率 / PMI / 进出口',
    keywords: ['宏观', 'GDP', 'CPI', 'PPI', '社融', 'M2', 'PMI', '利率', 'LPR', 'DR007', '国债', '工业增加值', '固定资产投资', '社零'],
  },
  {
    path: 'categories/指数/README.md',
    type: 'category',
    asset: '指数',
    coverage: 'partial',
    markets: ['A股', '港股'],
    summary: '指数（间接覆盖：成分用 quote-skill，估值用 financial-data）',
    keywords: ['指数', '沪深 300', '中证 500', '成分股', '中证', '上证', '深证'],
  },
  // ── 待开放（placeholder）──
  {
    path: 'categories/债券/README.md',
    type: 'category',
    asset: '债券',
    coverage: 'none',
    summary: '债券（占位 - 暂未开放）',
    keywords: ['债券', '国债', '企业债', '金融债', '城投债', '收益率', '评级', '含权'],
  },
  {
    path: 'categories/可转债/README.md',
    type: 'category',
    asset: '可转债',
    coverage: 'none',
    summary: '可转债（占位 - 暂未开放）',
    keywords: ['可转债', '转债', '转股价', '强赎', '下修', '溢价率'],
  },
  {
    path: 'categories/基金/README.md',
    type: 'category',
    asset: '基金',
    coverage: 'none',
    summary: '基金（占位 - 暂未开放专门 skill）',
    keywords: ['基金', '净值', 'ETF', '基金经理', '业绩比较', '基金规模', '基金持仓'],
  },
  {
    path: 'categories/期权/README.md',
    type: 'category',
    asset: '期权',
    coverage: 'none',
    summary: '期权（占位 - 暂未开放）',
    keywords: ['期权', '隐含波动率', '希腊字母', 'PCR', '期权链', '认购', '认沽'],
  },
  {
    path: 'categories/期货/README.md',
    type: 'category',
    asset: '期货',
    coverage: 'none',
    summary: '期货（占位 - 暂未开放）',
    keywords: ['期货', '商品期货', '股指期货', '国债期货', '主力合约', '仓单', '升贴水'],
  },
  {
    path: 'categories/权证/README.md',
    type: 'category',
    asset: '权证',
    coverage: 'none',
    summary: '权证（占位 - 暂未开放）',
    keywords: ['权证', '认购权证', '认沽权证'],
  },
  {
    path: 'categories/外汇/README.md',
    type: 'category',
    asset: '外汇',
    coverage: 'none',
    summary: '外汇（占位 - 暂未开放）',
    keywords: ['外汇', '汇率', '美元', '欧元', '日元', '人民币', '中间价', '即期', '远期', '货币对', 'USDCNY'],
  },
  // ── 索引 / 维护 ──
  {
    path: 'index.md',
    type: 'index',
    coverage: 'meta',
    summary: 'Wiki 全景导航（已开放 Skills + 能力分类 + 待开放 + 维护说明）',
    keywords: ['全景', '索引', '导航', '推荐', '什么能力', '有什么 skill', '能力清单'],
  },
  {
    path: 'skills/_coming_soon.md',
    type: 'meta',
    coverage: 'meta',
    cross_border_friendly: true,
    summary: '待开放方向占位（美股 / 全球宏观 / 加密货币 / 期货 / 外汇 / 债券 / 基金 等）',
    keywords: ['待开放', '美股', '美国', '欧股', '日股', '英股', '台股', '全球', '加密', 'BTC', 'ETH', '比特币', '以太坊', '美联储', 'fed', 'coming soon', '不支持', '什么时候开放', 'tesla', 'apple', 'nvidia', 'microsoft', 'google', '苹果', '特斯拉', '英伟达', '微软', '标普', 'sp500', '纳斯达克', '纳指', '道指', '道琼斯'],
  },
];

// ───── 工具函数 ─────

function die(msg, code = 1) {
  process.stderr.write(msg + '\n');
  process.exit(code);
}

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function fresh(path) {
  if (!existsSync(path)) return false;
  return Date.now() - statSync(path).mtimeMs < TTL_MS;
}

function safePath(rel) {
  // 防止 ../../ 越界
  const norm = normalize(rel).replace(/^(\.\.[\/\\])+/, '');
  if (norm.startsWith('..') || norm.includes('\0')) {
    die(`❌ 非法路径：${rel}`);
  }
  return norm;
}

// ───── 远程拉取 + 缓存 + 本地兜底 ─────

async function fetchRemote(relPath, { timeoutMs = 15_000 } = {}) {
  const url = `${REMOTE_BASE}/${relPath}`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}`, url };
    const text = await resp.text();
    return { ok: true, text, url };
  } catch (err) {
    return { ok: false, error: err.message, url };
  }
}

async function readDoc(relPath, { forceRemote = false } = {}) {
  const safe = safePath(relPath);
  const cachePath = join(CACHE_DIR, safe);
  const localPath = join(LOCAL_WIKI_DIR, safe);

  // 1. 强制刷新 → 直接拉远程
  if (forceRemote) {
    const r = await fetchRemote(safe);
    if (r.ok) {
      ensureDir(dirname(cachePath));
      writeFileSync(cachePath, r.text);
      return { source: 'remote_forced', text: r.text, url: r.url };
    }
    // 强制刷新失败，落到缓存或本地
  }

  // 2. 缓存新鲜（24h 内）→ 用缓存
  if (!forceRemote && fresh(cachePath)) {
    return { source: 'cache_fresh', text: readFileSync(cachePath, 'utf8'), path: cachePath };
  }

  // 3. 拉远程 → 写缓存
  const r = await fetchRemote(safe);
  if (r.ok) {
    ensureDir(dirname(cachePath));
    writeFileSync(cachePath, r.text);
    return { source: 'remote', text: r.text, url: r.url };
  }

  // 4. 缓存存在但过期 → 用过期缓存（远程拉不到至少有旧版）
  if (existsSync(cachePath)) {
    return { source: 'cache_stale', text: readFileSync(cachePath, 'utf8'), path: cachePath, remote_error: r.error };
  }

  // 5. 缓存也没有 → 用本地基线（skill 目录附带的快照）
  if (existsSync(localPath)) {
    return { source: 'local_baseline', text: readFileSync(localPath, 'utf8'), path: localPath, remote_error: r.error };
  }

  die(`❌ 文档拉取失败：${safe}\n远程错误：${r.error}\n本地基线也不存在：${localPath}`);
}

// ───── 命令 ─────

async function cmdListCapabilities() {
  const open = CAPABILITY_INDEX.filter(c => c.type === 'skill' && c.coverage === 'open');
  const categoriesFull = CAPABILITY_INDEX.filter(c => c.type === 'category' && c.coverage === 'full');
  const categoriesPartial = CAPABILITY_INDEX.filter(c => c.type === 'category' && c.coverage === 'partial');
  const categoriesNone = CAPABILITY_INDEX.filter(c => c.type === 'category' && c.coverage === 'none');

  const result = {
    ok: true,
    version: SKILL_VERSION,
    open_skills: open.map(c => ({ path: c.path, name: c.name, summary: c.summary })),
    categories: {
      full: categoriesFull.map(c => ({ path: c.path, asset: c.asset, sub: c.sub, summary: c.summary })),
      partial: categoriesPartial.map(c => ({ path: c.path, asset: c.asset, sub: c.sub, summary: c.summary })),
      none: categoriesNone.map(c => ({ path: c.path, asset: c.asset, summary: c.summary })),
    },
    next_steps: [
      `node scripts/cli.mjs find-capability "<用户问题关键词>"  # 找最贴的文档`,
      `node scripts/cli.mjs read-doc <path>  # 读对应 wiki 文档`,
    ],
  };
  console.log(JSON.stringify(result, null, 2));
}

async function cmdFindCapability(query) {
  if (!query || !query.trim()) {
    die(`❌ 用法：find-capability "<用户问题关键词>"\n例：find-capability "贵州茅台 最新价"`);
  }

  const q = query.toLowerCase();
  const isCrossBorder = detectCrossBorder(query);

  const scored = CAPABILITY_INDEX.map(cap => {
    let score = 0;
    for (const kw of cap.keywords) {
      if (q.includes(kw.toLowerCase())) score += kw.length;
    }

    // 跨境查询：限定 A股/港股/中国宏观 的 skill / category 直接排除
    // 避免把"美股 Tesla 股价"错配到 wind-quote-skill
    if (isCrossBorder && cap.markets) {
      const supportsCrossBorder = cap.markets.some(m =>
        ['美股', '欧股', '全球', '加密货币'].includes(m)
      );
      if (!supportsCrossBorder) score = 0;
    }

    // 跨境查询：cross_border_friendly 文档（_coming_soon.md 等）升权
    if (isCrossBorder && cap.cross_border_friendly) score *= 2;

    // category full / open skill 优先
    if (cap.coverage === 'full' || cap.coverage === 'open') score *= 1.5;
    if (cap.coverage === 'none') score *= 0.7;
    return { ...cap, score };
  })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // 没匹配到任何 keywords → 兜底返回 index.md 让 AI 全局看一遍
  if (scored.length === 0) {
    const result = {
      ok: true,
      query,
      cross_border_query: isCrossBorder,
      matches: [],
      fallback: {
        path: isCrossBorder ? 'skills/_coming_soon.md' : 'index.md',
        reason: isCrossBorder
          ? '检测到跨境市场关键词（美股/加密/欧股等），Wind 自家 skill 不覆盖，引导到待开放占位文档'
          : '关键词未直接命中，建议读 index.md 全景导航后人工判断',
      },
      next_step: `node scripts/cli.mjs read-doc ${isCrossBorder ? 'skills/_coming_soon.md' : 'index.md'}`,
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const result = {
    ok: true,
    query,
    cross_border_query: isCrossBorder,
    matches: scored.map(c => ({
      path: c.path,
      type: c.type,
      coverage: c.coverage,
      markets: c.markets,
      summary: c.summary,
      score: c.score,
    })),
    next_step: `node scripts/cli.mjs read-doc ${scored[0].path}`,
  };
  console.log(JSON.stringify(result, null, 2));
}

async function cmdReadDoc(relPath) {
  if (!relPath) {
    die(`❌ 用法：read-doc <path>\n例：read-doc categories/股票/行情.md`);
  }
  const r = await readDoc(relPath);
  console.log(JSON.stringify({ ok: true, path: relPath, ...r }, null, 2));
}

async function cmdRefreshWiki() {
  // 遍历 CAPABILITY_INDEX 全部 path + 几个固定 meta 文件，**直接拉远程**（不走 readDoc 兜底）
  const paths = [
    'index.md',
    '_sop.md',
    'categories/_third_party_placeholder.md',
    ...CAPABILITY_INDEX.map(c => c.path),
  ];
  const unique = [...new Set(paths)];

  const results = [];
  for (const p of unique) {
    const safe = safePath(p);
    const r = await fetchRemote(safe);
    if (r.ok) {
      const cachePath = join(CACHE_DIR, safe);
      ensureDir(dirname(cachePath));
      writeFileSync(cachePath, r.text);
      results.push({ path: p, status: 'remote_ok' });
    } else {
      results.push({ path: p, status: 'remote_failed', error: r.error });
    }
  }

  const ok = results.filter(r => r.status === 'remote_ok').length;
  const failed = results.filter(r => r.status === 'remote_failed');
  console.log(JSON.stringify({
    ok: failed.length === 0,
    refreshed: ok,
    total: unique.length,
    failed: failed.length > 0 ? failed.slice(0, 5) : undefined,
    cache_dir: CACHE_DIR,
    note: failed.length > 0
      ? '远程拉取失败时本地基线（references/wiki/）仍可作兜底，read-doc 仍能正常工作'
      : undefined,
  }, null, 2));
}

// ───── 主入口 ─────

const [cmd, ...args] = process.argv.slice(2);

const USAGE =
  `wind-find-finance-skill v${SKILL_VERSION}\n` +
  `Wind AIMarket 金融能力发现器（meta-skill，读 llm-wiki 推荐对路 skill）\n\n` +
  `用法：\n` +
  `  cli.mjs list-capabilities                 # 列出全部已开放 skill + categories\n` +
  `  cli.mjs find-capability "<关键词>"        # 关键词找最贴的 wiki 文档\n` +
  `  cli.mjs read-doc <path>                   # 读 wiki 文档（远程优先 + 24h 缓存 + 本地兜底）\n` +
  `  cli.mjs refresh-wiki                      # 强制全量刷新本地缓存\n\n` +
  `典型流程：\n` +
  `  1. find-capability "贵州茅台 最新价"\n` +
  `  2. read-doc categories/股票/行情.md\n` +
  `  3. AI 给用户答复（推荐 skill + 安装命令 + 简短能力陈述）`;

const commands = {
  'list-capabilities': () => cmdListCapabilities(),
  'find-capability': () => cmdFindCapability(args[0]),
  'read-doc': () => cmdReadDoc(args[0]),
  'refresh-wiki': () => cmdRefreshWiki(),
};

if (!cmd || !commands[cmd]) {
  process.stderr.write(USAGE + '\n');
  process.exit(cmd ? 1 : 0);
}

commands[cmd]().catch((err) => {
  die(`❌ 执行失败：${err.stack || err.message || err}`);
});
