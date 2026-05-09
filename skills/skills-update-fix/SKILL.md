---
name: skills-update-fix
description: >-
  修复 Windows 用户路径含空格导致 skills update 失败的问题。当用户报告 `skills update` 报错
  "Failed to update" 时触发，诊断根因并修补本地 CLI 代码。适用于 Windows 平台且用户目录路径包含空格的场景。
auto_invoke: false
examples:
  - "skills update 失败了怎么办"
  - "运行 skills update 报错 Failed to update"
  - "skills update 不能用了"
  - "升级 skill 失败"
---

# skills update 修复工具

修复 Windows 用户路径含空格导致 `skills update` 失败的问题。

---

## 1. 问题现象

```bash
skills update <skill-name> -g -y
```

输出：

```
Updating <skill-name>...
Found 1 global update(s)

Updating <skill-name>...
  ✗ Failed to update <skill-name>

Failed to update 1 skill(s)
```

没有任何有用的错误信息，只有一句 `Failed to update`。

## 2. 根因分析

### 2.1 定位调用链

`skills update` 内部通过 `spawnSync` 调用 `skills add`：

```javascript
// node_modules/skills/dist/cli.mjs 第 4727 行
spawnSync(process.execPath, [
    cliEntry,    // → C:\Users\Miracle maker\AppData\...\bin\cli.mjs
    "add",
    installUrl,
    "-g",
    "-y"
], {
    stdio: ["inherit", "pipe", "pipe"],
    encoding: "utf-8",
    shell: process.platform === "win32"   // Windows 上 shell: true
})
```

关键：`stdio` 设为 `"pipe"`，stderr 被吞掉，用户看不到真实错误。

### 2.2 捕获真实错误

用 Node.js 脚本模拟同样的 `spawnSync` 调用并打印 stderr：

```bash
cd "$(npm root -g)/skills" && node -e "
const { spawnSync } = require('child_process');
const path = require('path');
const cliEntry = path.join(__dirname, '..', 'bin', 'cli.mjs');
const result = spawnSync(process.execPath, [
  cliEntry, 'add',
  'bobibobu/financial-skills/skills/wind-mcp-skill',
  '-g', '-y'
], { encoding: 'utf-8', shell: process.platform === 'win32' });
console.log('STATUS:', result.status);
console.log('STDERR:', result.stderr);
"
```

输出：

```
STATUS: 1
STDERR: C:\Users\Miracle:1
SyntaxError: Invalid or unexpected token
```

### 2.3 根因

**Windows 用户目录含空格**（如 `C:\Users\Miracle maker\`）。

`spawnSync` 的 `shell: true` 在 Windows 上使用 cmd.exe，路径中的空格导致 cmd.exe 将 `C:\Users\Miracle` 和 `maker\AppData\...` 拆成两部分，无法正确解析，抛出 `SyntaxError`。

## 3. 修复步骤

### 3.1 定位目标文件

```bash
# 找到 skills CLI 的安装路径
SKILLS_DIR="$(npm root -g)/skills"
echo "$SKILLS_DIR/dist/cli.mjs"
# 例如: C:\Users\Miracle maker\AppData\Roaming\npm\node_modules\skills\dist\cli.mjs
```

### 3.2 找到目标行

搜索 `spawnSync(process.execPath` 关键字，全局更新（`updateGlobalSkills`）的调用大约在第 **4727 行**：

```bash
grep -n "spawnSync(process.execPath" "$SKILLS_DIR/dist/cli.mjs"
```

### 3.3 打补丁

给 `process.execPath` 和 `cliEntry` 加双引号：

**修改前：**

```javascript
spawnSync(process.execPath, [
    cliEntry,
    "add",
    installUrl,
    "-g",
    "-y"
], {
```

**修改后：**

```javascript
spawnSync(`"${process.execPath}"`, [
    `"${cliEntry}"`,
    "add",
    installUrl,
    "-g",
    "-y"
], {
```

用 sed 一行完成（注意只替换全局更新那段，不是所有 spawnSync）：

```bash
SKILLS_DIR="$(npm root -g)/skills"

# 给 process.execPath 加引号
sed -i 's/spawnSync(process\.execPath, \[/spawnSync(`"${process.execPath}"`, [/' "$SKILLS_DIR/dist/cli.mjs"

# 给 cliEntry 加引号（只替换第一个匹配，即全局更新那段）
sed -i '0,/^\t\t\tcliEntry,$/s//\t\t\t`"${cliEntry}"`,/' "$SKILLS_DIR/dist/cli.mjs"
```

### 3.4 验证修复

```bash
skills update <skill-name> -g -y
```

成功输出：

```
Updating <skill-name>...
Checking global skill 1/1: <skill-name>
✓ Updated <skill-name>
```

## 4. 注意事项

| 规则 | 说明 |
|---|---|
| 补丁是本地的 | 修改的是 `node_modules` 中的 `dist/cli.mjs`，下次 `npm update -g skills` 升级 CLI 后补丁会被覆盖，需重新打 |
| 只影响全局更新 | `updateGlobalSkills` 函数中的那一个 `spawnSync`，不影响项目级 skill 更新 |
| 建议 | 给 skills CLI 项目提 issue / PR，让上游修复路径引号问题 |

## 5. 判断条件

遇到以下情况时使用本 skill：

1. 操作系统是 **Windows**
2. 用户目录路径**包含空格**（检查 `echo $HOME` 或 `echo %USERPROFILE%`）
3. `skills update` 输出 `Failed to update` 且无其它错误信息
4. 单独运行 `skills add` 可以成功
