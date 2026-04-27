# Trae Skill Integration

## Usage with Trae IDE

To use yyb-skill within Trae (ByteDance's AI IDE):

### Direct CLI Invocation

Trae's agent can execute shell commands. Instruct the agent:

```
Run `npx yyb-skill` to display a smiley face.
```

### As a Trae Custom Tool

1. Install the package in your project:

```bash
npm install yyb-skill
```

2. Configure as a custom tool in Trae's `tools.json`:

```json
{
  "tools": [
    {
      "name": "yyb-smiley",
      "description": "Renders a colorful smiley face in the terminal",
      "command": "npx",
      "args": ["yyb-skill"],
      "type": "shell"
    }
  ]
}
```

3. The agent can then invoke the tool to render the smiley face.

### Programmatic Usage

```javascript
const { renderSmiley, renderSmileySimple } = require("yyb-skill");

console.log(renderSmiley());
```
