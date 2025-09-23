# @kids/blockly-extensions

Custom Blockly blocks and React workspace wrapper for the Kids Coding Platform.

## Features
- Registers Kids-themed control, variable, and logic blocks with a shared namespace and color palette.
- Provides a `BlocklyWorkspace` React component that injects a workspace with the custom toolbox.
- Exports `createCodeGenerator` helpers for Python/JavaScript code generation.
- Shares block palette and namespace utilities for other surfaces to reuse.

## Usage

```tsx
import * as Blockly from 'blockly/core';
import { BlocklyWorkspace, createCodeGenerator } from '@kids/blockly-extensions';

export function Playground() {
  return (
    <div style={{ height: 520 }}>
      <BlocklyWorkspace
        onWorkspaceChange={(workspace) => {
          const { toPython } = createCodeGenerator(Blockly);
          console.log(toPython(workspace));
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
