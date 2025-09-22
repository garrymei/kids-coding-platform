# @kids/blockly-extensions

Custom Blockly blocks and React workspace wrapper for the Kids Coding Platform.

## Features
- Registers Kids-themed control, variable, and logic blocks (placeholder definitions ready for future extension).
- Provides a `BlocklyWorkspace` React component that injects a workspace with the custom toolbox.
- Exports `registerKidsBlocks` for manual integration.

## Usage

```tsx
import { BlocklyWorkspace } from '@kids/blockly-extensions';

export function Playground() {
  return (
    <div style={{ height: 520 }}>
      <BlocklyWorkspace
        onWorkspaceChange={(workspace) => {
          const js = Blockly.JavaScript.workspaceToCode(workspace);
          console.log(js);
        }}
      />
    </div>
  );
}
```

To register blocks manually:

```ts
import * as Blockly from 'blockly/core';
import { registerKidsBlocks } from '@kids/blockly-extensions';

registerKidsBlocks(Blockly);
```

## Build

```bash
pnpm -F @kids/blockly-extensions build
```
