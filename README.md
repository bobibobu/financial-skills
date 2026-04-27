# yyb-skill

A cross-platform CLI skill that renders a colorful smiley face UX in the terminal. Compatible with **Claude Code**, **OpenAI Codex**, **Trae**, and any tool that can execute shell commands.

## Quick Start

```bash
# Run directly with npx (no installation needed)
npx yyb-skill

# Simple mode
npx yyb-skill --simple
```

## Installation

```bash
# Install globally
npm install -g yyb-skill

# Then run anywhere
yyb-skill
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

Copy `.claude/commands/smiley.md` into your project's `.claude/commands/` directory, then use:

```
/smiley
```

### OpenAI Codex

Codex can invoke it as a shell command:

```bash
npx yyb-skill
```

### Trae

Add as a custom tool in Trae's tool configuration:

```json
{
  "name": "yyb-smiley",
  "description": "Renders a colorful smiley face in the terminal",
  "command": "npx",
  "args": ["yyb-skill"],
  "type": "shell"
}
```

## Programmatic API

```javascript
const { renderSmiley, renderSmileySimple } = require("yyb-skill");

console.log(renderSmiley());       // Fancy mode with colors
console.log(renderSmileySimple()); // Simple mode
```

## Install from Gitee

```bash
# Install directly from Gitee
npm install git+https://gitee.com/codethe/yyb_skill.git

# Or clone and install
git clone https://gitee.com/codethe/yyb_skill.git
cd yyb_skill
npm install -g .
```

## License

MIT
