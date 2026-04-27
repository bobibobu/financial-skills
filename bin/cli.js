#!/usr/bin/env node
"use strict";

const path = require("path");
const fs = require("fs");
const { renderSmiley, renderSmileySimple } = require("../src/smiley");

const cwd = process.cwd();
const pkgRoot = path.resolve(__dirname, "..");

function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function install() {
  const results = [];

  // --- 1. 安装本地可执行工具到 .yyb-skill/ ---
  const toolDir = path.join(cwd, ".yyb-skill");
  mkdirp(toolDir);

  fs.copyFileSync(
    path.join(pkgRoot, "src", "smiley.js"),
    path.join(toolDir, "smiley.js")
  );

  fs.writeFileSync(
    path.join(toolDir, "bin.js"),
    [
      "#!/usr/bin/env node",
      '"use strict";',
      'const { renderSmiley, renderSmileySimple } = require("./smiley");',
      "const args = process.argv.slice(2);",
      'const simple = args.includes("--simple") || args.includes("-s");',
      "console.log(simple ? renderSmileySimple() : renderSmiley());",
      "",
    ].join("\n")
  );

  results.push({ tool: "YYB Skill", target: ".yyb-skill/" });

  // --- 2. Claude Code ---
  const claudeDir = path.join(cwd, ".claude", "commands");
  mkdirp(claudeDir);
  fs.writeFileSync(
    path.join(claudeDir, "smiley.md"),
    [
      "---",
      'description: "在终端渲染一个笑脸 UX"',
      "---",
      "",
      "执行以下命令渲染笑脸：",
      "",
      "```bash",
      "node .yyb-skill/bin.js",
      "```",
      "",
      "简洁模式：",
      "",
      "```bash",
      "node .yyb-skill/bin.js --simple",
      "```",
      "",
    ].join("\n")
  );
  results.push({ tool: "Claude Code", target: ".claude/commands/smiley.md" });

  // --- 3. Codex ---
  const codexDir = path.join(cwd, ".codex");
  mkdirp(codexDir);
  fs.writeFileSync(
    path.join(codexDir, "yyb-smiley.md"),
    [
      "# YYB Smiley Skill",
      "",
      "在项目中执行以下命令来渲染笑脸：",
      "",
      "```bash",
      "node .yyb-skill/bin.js",
      "```",
      "",
      "简洁模式：",
      "",
      "```bash",
      "node .yyb-skill/bin.js --simple",
      "```",
      "",
    ].join("\n")
  );
  results.push({ tool: "Codex", target: ".codex/yyb-smiley.md" });

  // --- 4. Trae ---
  const traeDir = path.join(cwd, ".trae");
  mkdirp(traeDir);
  const traeFile = path.join(traeDir, "tools.json");
  const newTool = {
    name: "yyb-smiley",
    description: "在终端渲染一个彩色笑脸 UX",
    command: "node",
    args: [".yyb-skill/bin.js"],
  };

  let config = { tools: [] };
  if (fs.existsSync(traeFile)) {
    try {
      config = JSON.parse(fs.readFileSync(traeFile, "utf8"));
    } catch (_) {
      config = { tools: [] };
    }
  }
  if (!config.tools) config.tools = [];
  if (!config.tools.some((t) => t.name === newTool.name)) {
    config.tools.push(newTool);
  }
  fs.writeFileSync(traeFile, JSON.stringify(config, null, 2) + "\n");
  results.push({ tool: "Trae", target: ".trae/tools.json" });

  return results;
}

// --- 执行 ---
const installed = install();
const args = process.argv.slice(2);
const simple = args.includes("--simple") || args.includes("-s");
console.log(simple ? renderSmileySimple() : renderSmiley());

const G = "\x1b[32m";
const B = "\x1b[1m";
const C = "\x1b[36m";
const D = "\x1b[2m";
const R = "\x1b[0m";

console.log(`${B}${G}✓ Skill installed successfully!${R}`);
console.log("");
for (const item of installed) {
  console.log(`  ${C}${item.tool}${R}  →  ${D}${item.target}${R}`);
}
console.log("");
console.log(`${D}安装完毕，直接使用:${R}`);
console.log(`  Claude Code  →  输入 ${C}/smiley${R}`);
console.log(`  Trae         →  告诉 Agent ${C}"使用 yyb-smiley 工具"${R}`);
console.log(`  Codex        →  让 Agent 运行 ${C}node .yyb-skill/bin.js${R}`);
console.log("");
