# yyb-skill

A cross-platform CLI skill that renders a colorful smiley face UX in the terminal. Compatible with **Claude Code**, **OpenAI Codex**, **Trae**, and any tool that can execute shell commands.

> 本项目托管在 Gitee：https://gitee.com/codethe/yyb_skill

## 一键安装

在你的项目根目录下运行：

```bash
npx git+https://gitee.com/codethe/yyb_skill.git
```

这一条命令会自动完成以下所有操作：

| 工具 | 自动安装的文件 |
|------|---------------|
| **Claude Code** | `.claude/commands/smiley.md` |
| **Codex** | `.codex/yyb-smiley.md` |
| **Trae** | `.trae/tools.json` |

运行后会显示一个笑脸，表示安装成功。

## 使用方式

### Claude Code

安装完成后，在 Claude Code 中直接输入：

```
/smiley
```

### Codex

在 Codex 的对话中让它执行：

```bash
npx git+https://gitee.com/codethe/yyb_skill.git
```

或者安装完成后 Codex 可读取 `.codex/yyb-smiley.md` 了解调用方式。

### Trae

安装完成后，`.trae/tools.json` 已自动配置好工具定义，Trae 可直接识别并调用。

### 任何支持 shell 的工具

```bash
npx git+https://gitee.com/codethe/yyb_skill.git
```

## 输出效果

### 花式模式（默认）

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

### 简洁模式（加 `--simple` 参数）

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

## 编程调用

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
