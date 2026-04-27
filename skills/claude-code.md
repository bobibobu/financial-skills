# Claude Code Skill Definition

## 使用方式

### 方式一：直接通过 npx 运行（无需安装）

```bash
npx git+https://gitee.com/codethe/yyb_skill.git
```

简洁模式：

```bash
npx git+https://gitee.com/codethe/yyb_skill.git --simple
```

### 方式二：注册为 Claude Code 自定义命令

将 `.claude/commands/smiley.md` 复制到你的项目 `.claude/commands/` 目录下。

然后在 Claude Code 中输入：

```
/smiley
```

或简洁模式：

```
/smiley simple
```

### 方式三：全局安装后使用

```bash
npm install -g git+https://gitee.com/codethe/yyb_skill.git
yyb-skill
```

### 编程调用

```bash
npm install git+https://gitee.com/codethe/yyb_skill.git
```

```javascript
const { renderSmiley, renderSmileySimple } = require("yyb-skill");

console.log(renderSmiley());       // 花式模式
console.log(renderSmileySimple()); // 简洁模式
```
