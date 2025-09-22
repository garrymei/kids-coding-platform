# @kids/ui-kit

Shared React UI components for the Kids Coding Platform.

## Components

- `Button` – gradient primary button with variants (`primary`, `secondary`, `ghost`).
- `Card` – rounded container with optional title and featured state.
- `Progress` – progress indicator with percentage label.
- `Badge` – pill badge supporting info/success/warning/danger tones.

## Usage

```tsx
import { Button, Card, Progress, Badge } from '@kids/ui-kit';

export function Example() {
  return (
    <Card heading="今日任务">
      <Progress value={42} label="Python 入门 · 第 3 章" />
      <Badge text="+30 XP" tone="success" />
      <Button variant="primary">开始任务</Button>
    </Card>
  );
}
```

## Build

```bash
pnpm -F @kids/ui-kit build
```

The build command outputs compiled code and declaration files into the `dist/` folder.
