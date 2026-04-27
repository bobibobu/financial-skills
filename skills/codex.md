# Codex Skill Integration

## Usage with OpenAI Codex

To use yyb-skill as a tool in Codex, add the following to your Codex configuration:

### As a Shell Command Tool

Codex can invoke yyb-skill as a shell command:

```bash
npx yyb-skill
```

### Integration via package.json script

Add to your project's `package.json`:

```json
{
  "scripts": {
    "smiley": "yyb-skill",
    "smiley:simple": "yyb-skill --simple"
  }
}
```

Then Codex can run:

```bash
npm run smiley
```

### Programmatic API

```javascript
const { renderSmiley, renderSmileySimple } = require("yyb-skill");

// Returns a string with ANSI-colored smiley face
const output = renderSmiley();
console.log(output);
```
