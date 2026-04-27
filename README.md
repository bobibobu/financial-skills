# yyb-skill

A cross-platform CLI skill that renders a colorful smiley face UX in the terminal. Compatible with **Claude Code**, **OpenAI Codex**, **Trae**, and any tool that can execute shell commands.

> 本项目托管在 Gitee：https://gitee.com/codethe/yyb_skill

## Quick Start

无需安装，直接通过 npx 从 Gitee 运行：

```bash
# 花式模式（默认）
npx git+https://gitee.com/codethe/yyb_skill.git

# 简洁模式
npx git+https://gitee.com/codethe/yyb_skill.git --simple
```

## 安装到本地

```bash
# 从 Gitee 安装到全局
npm install -g git+https://gitee.com/codethe/yyb_skill.git

# 安装后即可直接使用
yyb-skill
yyb-skill --simple
```

或者克隆后本地安装：

```bash
git clone https://gitee.com/codethe/yyb_skill.git
cd yyb_skill
npm install -g .
yyb-skill
```

或者作为项目依赖安装：

```bash
npm install git+https://gitee.com/codethe/yyb_skill.git
```

安装后可在 `package.json` 的 scripts 中使用：

```json
{
  "scripts": {
    "smiley": "yyb-skill",
    "smiley:simple": "yyb-skill --simple"
  }
}
```

## Output

### Fancy Mode (default)

```
╔══════════════════════════════════════════╗
║                                          ║
║    😊   YYB SKILL — Hello World!   😊    ║
║                                          ║
╠══════════════════════════════════════════╣
║                                          ║
║         ████████████████                 ║
║       ██                ██               ║
║     ██    ██        ██    ██             ║
║     ██  ▓▓▓▓    ▓▓▓▓  ██               ║
║     ██    ██        ██    ██             ║
║     ██                          ██       ║
║     ██  ╰────────────────╯  ██          ║
║     ██   ╰──────────────╯   ██          ║
║       ██                    ██           ║
║         ████████████████                 ║
║                                          ║
║  Compatible with Claude Code · Codex · Trae  ║
║                                          ║
╚══════════════════════════════════════════╝
```

### Simple Mode (`--simple`)

```
😊 Hello from YYB Skill! 😊

  ╔══════════════╗
  ║              ║
  ║   ◉      ◉   ║
  ║              ║
  ║   ╲______╱   ║
  ║              ║
  ╚══════════════╝

  Claude Code · Codex · Trae Compatible
```

## AI Tool Integration

### Claude Code

将 `.claude/commands/smiley.md` 复制到你项目的 `.claude/commands/` 目录中，然后在 Claude Code 中输入：

```
/smiley
```

该 skill 会自动执行：

```bash
npx git+https://gitee.com/codethe/yyb_skill.git
```

### OpenAI Codex

Codex 可以直接通过 shell 命令调用：

```bash
npx git+https://gitee.com/codethe/yyb_skill.git
```

也可以在项目 `package.json` 中添加 script 后让 Codex 执行 `npm run smiley`。

### Trae

在 Trae 的自定义工具配置中使用：

```json
{
  "tools": [
    {
      "name": "yyb-smiley",
      "description": "在终端渲染一个彩色笑脸",
      "command": "npx",
      "args": ["git+https://gitee.com/codethe/yyb_skill.git"],
      "type": "shell"
    }
  ]
}
```

## Programmatic API

```bash
npm install git+https://gitee.com/codethe/yyb_skill.git
```

```javascript
const { renderSmiley, renderSmileySimple } = require("yyb-skill");

console.log(renderSmiley());       // 花式模式
console.log(renderSmileySimple()); // 简洁模式
```

## License

MIT
