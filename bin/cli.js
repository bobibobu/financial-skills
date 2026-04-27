#!/usr/bin/env node
"use strict";

const path = require("path");
const fs = require("fs");
const { renderSmiley, renderSmileySimple } = require("../src/smiley");

const args = process.argv.slice(2);
const simple = args.includes("--simple") || args.includes("-s");

const cwd = process.cwd();
const pkgRoot = path.resolve(__dirname, "..");

function installSkills() {
  const results = [];

  // --- Claude Code ---
  const claudeDir = path.join(cwd, ".claude", "commands");
  mkdirp(claudeDir);
  const claudeSrc = path.join(pkgRoot, ".claude", "commands", "smiley.md");
  const claudeDest = path.join(claudeDir, "smiley.md");
  copyIfNewer(claudeSrc, claudeDest);
  results.push({ tool: "Claude Code", target: ".claude/commands/smiley.md" });

  // --- Codex ---
  const codexDir = path.join(cwd, ".codex");
  mkdirp(codexDir);
  const codexSrc = path.join(pkgRoot, "skills", "codex.md");
  const codexDest = path.join(codexDir, "yyb-smiley.md");
  copyIfNewer(codexSrc, codexDest);
  results.push({ tool: "Codex", target: ".codex/yyb-smiley.md" });

  // --- Trae ---
  const traeDir = path.join(cwd, ".trae");
  mkdirp(traeDir);
  const traeTool = {
    name: "yyb-smiley",
    description: "在终端渲染一个彩色笑脸 UX",
    command: "npx",
    args: ["git+https://gitee.com/codethe/yyb_skill.git"],
  };
  const traeFile = path.join(traeDir, "tools.json");
  writeToolConfig(traeFile, traeTool);
  results.push({ tool: "Trae", target: ".trae/tools.json" });

  return results;
}

function mkdirp(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyIfNewer(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
}

function writeToolConfig(filePath, tool) {
  let config = { tools: [] };
  if (fs.existsSync(filePath)) {
    try {
      config = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (_) {
      config = { tools: [] };
    }
  }
  if (!config.tools) config.tools = [];

  const exists = config.tools.some((t) => t.name === tool.name);
  if (!exists) {
    config.tools.push(tool);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + "\n");
  }
}

// --- Main ---
const installed = installSkills();

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
