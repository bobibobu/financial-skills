# Codex Skill Integration

## Usage with OpenAI Codex

### 直接通过 npx 调用（无需安装）

Codex 可以直接通过 shell 命令调用：

```bash
npx git+https://gitee.com/codethe/yyb_skill.git
```

简洁模式：

```bash
npx git+https://gitee.com/codethe/yyb_skill.git --simple
```

### 通过 package.json script 集成

先安装到项目：

```bash
npm install git+https://gitee.com/codethe/yyb_skill.git
```

然后在 `package.json` 中添加：

```json
{
  "scripts": {
    "smiley": "yyb-skill",
    "smiley:simple": "yyb-skill --simple"
  }
}
```

之后 Codex 可以执行：

```bash
npm run smiley
```

### 编程调用

```javascript
const { renderSmiley, renderSmileySimple } = require("yyb-skill");

const output = renderSmiley();
console.log(output);
```
