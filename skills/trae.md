# Trae Skill Integration

## Usage with Trae IDE

### 直接通过 npx 调用（无需安装）

Trae 的 agent 可以执行 shell 命令，直接运行：

```
npx git+https://gitee.com/codethe/yyb_skill.git
```

### 作为 Trae 自定义工具配置

1. 先安装到项目：

```bash
npm install git+https://gitee.com/codethe/yyb_skill.git
```

2. 在 Trae 的工具配置文件（`tools.json`）中添加：

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

3. Agent 即可通过调用该工具来渲染笑脸。

### 全局安装后使用

```bash
npm install -g git+https://gitee.com/codethe/yyb_skill.git
yyb-skill
```

### 编程调用

```javascript
const { renderSmiley, renderSmileySimple } = require("yyb-skill");

console.log(renderSmiley());
```
