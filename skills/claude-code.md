# Claude Code Skill Definition

## Installation

Add this skill to your Claude Code project by running:

```bash
# Install globally
npm install -g yyb-skill

# Or use directly with npx
npx yyb-skill
```

## Register as Claude Code Custom Command

Copy the contents of `.claude/commands/smiley.md` into your project's `.claude/commands/` directory.

Then you can invoke it in Claude Code with:

```
/smiley
```

Or with simple mode:

```
/smiley simple
```

## Programmatic Usage

```javascript
const { renderSmiley, renderSmileySimple } = require("yyb-skill");

console.log(renderSmiley());       // Fancy mode
console.log(renderSmileySimple()); // Simple mode
```
