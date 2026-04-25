---
type: sop
purpose: Wind AIMarket llm-wiki 维护 SOP（标准操作流程）
version: v1
last_updated: 2026-04-25
---

# llm-wiki 维护 SOP

> 本文档给 Wind AIMarket 平台维护人员 + AI 编辑工具参考，规定新增 / 修改 wiki 时的标准动作。

## 1. 新增 skill / 工具时的标准流程

| 步骤 | 操作 | 产出 |
|---|---|---|
| **S1** | 跑 `node scripts/cli.mjs list-tools` 拿真实 description + inputSchema | `tools.json` 缓存（`~/.cache/wind-aimarket/tools/<server>.json`）|
| **S2** | **资深金融从业者视角**设计 ≥15 个测试用例（覆盖五类，见 §3）| `_evidence/<tool>_cases.md` |
| **S3** | 实测每个用例，记录实际行为 / vs description / decision | `_evidence/<tool>.json` |
| **S4** | 基于实测写工具档案（按 §4 6 段标准）| `skills/<skill_name>.md`（顶层 frontmatter）+ 每工具 sub-section |
| **S5** | 更新 `index.md` "全部 Skills" 表（含安装命令 + 一行 summary）| `index.md` |
| **S6** | 更新对应 `categories/<asset>/<sub>.md` 的 `recommended_skills` | `categories/<asset>/<sub>.md` |
| **S7** | 如果该 skill 把某个 placeholder 资产从 none 提升 → 更新该 placeholder/README.md 的 `coverage` 字段；若完全覆盖则把目录改为完整子目录结构 | `categories/<asset>/` |
| **S8** | 从 `skills/_coming_soon.md` 移除已开放方向 | `_coming_soon.md` |
| **S9** | push GitHub → 已装用户的 AI 通过 cli.mjs 远程拉自动同步（24h 缓存） | git commit |

## 2. 工具档案 6 段标准（A-F）

| 段 | 内容 | 来源 | 守则 |
|---|---|---|---|
| **A. 它能做什么** | 1:1 抄真实 description（标注"来自工具描述"）| 实测 list-tools | **不修改不发挥** |
| **B. 实测边界** | 资深金融从业者视角设计用例，实测真实行为 | 实测 call | description 偏强 / 偏弱处明确标注 |
| **C. 它的特点** | 业务语言总结独特价值 | 基于 A+B 总结 | **不夸张**，禁用词清单见 §4 |
| **D. 典型用法** | 抄 description 里的真实示例 | 实测 | 不发挥 |
| **E. 适合 / 不适合** | 引导用户决策对路 skill | 主观但克制 | 不适合的场景**显式列出引导路径** |
| **F. 计费层级** | T0-T4 + business stage | 价值评分 | 内测期 + 正式期双口径 |

## 3. 完整测试用例约定（≥15 用例 / 工具）

资深金融从业者视角，每个工具至少覆盖 5 类用例：

| 类型 | 用例数 | 目的 |
|---|---|---|
| **Description 直接覆盖（基线）** | 3-5 | 验证 description 主述能力是否真实可用 |
| **衍生 / 计算类**（带模型工具特别重要）| 3-5 | 测试自然语言能否触发 description 列出的衍生计算 |
| **跨标的 / 跨期 / 跨品种边界** | 2-3 | 测试模型解析复杂提问的能力上限 |
| **越界用例**（description 没说的，看是否支持）| 3-5 | **关键** —— 发现"实际能做但 description 没列"或"description 列了但实际不开放"|
| **容错用例**（错别字 / 模糊 / 极端边界） | 2-3 | 测试稳定性 + 错误信息友好度 |

### 用例记录格式（YAML）

```yaml
- case: <用例标识>
  input: "..."
  result: ok | error | partial
  actual_behavior: |
    实际返回 / 错误信息 / 异常表现
  vs_description: 符合 | 超出 | 未达 | 模糊待定
  decision: 在 wiki 怎么写（B 段哪个 # 表格行 / E 段是否新增引导路径）
```

存在 `_evidence/<tool>_cases.yaml`，跟工具档案 push 同一 commit。

## 4. 客户语言禁用词清单

| ❌ 禁用 | ✅ 替代 |
|---|---|
| RAG | 金融文档检索 |
| NL 解析 / NLU | 自然语言查询 |
| AI 推理引擎 | 自动计算 |
| 语义召回 | 跨多种官方信息源查找 |
| 衍生指标推导 | 计算指标（财务比率 / 增长率等）|
| 雇一个金融分析师 | （删除，不要类比）|
| 国内独家 / 稀缺性 | （删除，让 AI 用业务语言陈述能力即可）|
| D1-D4 各项分数 | （只在 frontmatter 给 AI，不在正文给客户）|

## 5. Schema 真相优先原则（feedback_wiki_schema_truth）

**A 段抄 description 主文本 OK**，但**主参数描述 / 适合场景 / 协作建议**这些"AI 该怎么调用"的字段，必须以 **schema enum_map / inputSchema 真相**为准。

具体执行：

1. 拿到 list-tools 输出后，**先看 `inputSchema.properties.<param>.enum_map` / `enum`**，再决定主参数文档怎么写
2. description 自由文本里提到、但 enum_map 没暴露的能力 → 进 **B 段越界用例**，标"description 描述偏强，实测仅 X/Y 可用"
3. **E 段不适合清单**显式列出"description 提到但实际不开放"的能力，让 AI 遇到这类诉求时诚实告知用户"当前未开放"
4. **C 段业务语言**只描述 schema 真实开放的能力，不要为"显得能力多"而扩散
5. description 文本和 schema 不一致时，**schema 是真相**

## 6. MVP vs 完整版

- **MVP（当前阶段）**：基于 description + 简单 1-2 用例快速写 → 让 wiki 骨架先跑起来
- **完整版（下一轮）**：每工具完整 ≥15 用例实测 → `_evidence/` 进 git → 工具档案 B 段从快速版扩到完整表

> **alice 锁定（2026-04-25）：** "现在不做完整实测这个动作，但要写清楚（在 SOP 里）。"

## 7. 版本与变更

| 日期 | 版本 | 变更 | 触发 |
|---|---|---|---|
| 2026-04-25 | v1 | 初版落地（wind-financial-data-skill v1 sample 完成）| BMad Master × alice |
