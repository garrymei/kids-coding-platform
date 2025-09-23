# Student App Base

`apps/student-app` provides the H5 shell for the student experience. It ships with routing, global styles, Blockly lab integration, a mock state store, and an optional Sentry hook.

## Development Commands

```bash
pnpm install
pnpm --filter @kids/student-app dev:h5
```

Other common scripts:

- `pnpm --filter @kids/student-app build` – production build (`vite` + TypeScript)
- `pnpm --filter @kids/student-app lint` – run ESLint

## Environment Variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_EXECUTOR_HTTP_URL` | Executor REST endpoint | `http://localhost:4060/execute` |
| `VITE_EXECUTOR_WS_URL` | Executor WebSocket base | `ws://localhost:4070` |
| `VITE_SENTRY_DSN` | Optional front-end error reporting DSN | _unset_ |

## Routes

| Path | Description |
| --- | --- |
| `/home` | Learning overview (XP, streak, recommended course) |
| `/courses` | Course list and mainline selector |
| `/lab` | Blockly lab with execution pipeline |

`/` redirects to `/home`.

## Design System

- UI components come from `@kids/ui-kit` (`Button`, `Card`, `Badge`, `Progress`, plus design tokens).
- Global styles live in `src/index.css`; navigation and lab layout styles are in `src/App.css`.

## State & Services

- `src/store/studentStore.tsx` maintains mock student data and expose `completeLesson` / `setFocusCourse` actions.
- `src/services/http.ts` declares the HTTP client interface (currently stubbed for future API wiring).

## Lab Execution Flow

`src/pages/LabPage.tsx` converts Blockly blocks into Python, posts the code to the executor (`POST /execute`), listens for WebSocket updates (`run-results/<jobId>`), and renders console output plus a placeholder reward message.
