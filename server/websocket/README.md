# Kids Coding Platform · WebSocket Gateway

Lightweight WS service that streams execution results and notifications to front-end clients.

## Channels

| Channel Pattern            | Payload Example                                                           |
|----------------------------|---------------------------------------------------------------------------|
| `run-results/<sessionId>`  | `{ type: 'run-result', payload: { stdout: string[], status: 'completed' } }` |
| `notifications/<userId>`   | `{ type: 'notification', payload: { title, body, sentAt } }`                |

Every new connection immediately receives a `welcome` message indicating the heartbeat interval and supported channel helpers. A stub payload is published one second after connect so UI clients can validate rendering pipelines before real integrations are wired.

## Local Development

```bash
pnpm --filter @kids/websocket dev
# or build & run
pnpm --filter @kids/websocket build
pnpm --filter @kids/websocket start
```

Environment variables:

```env
WS_PORT=4070
LOG_LEVEL=info
```

## Heartbeat & Reconnect

- The gateway emits a `ping` every 15s; browsers automatically respond with `pong`.
- If a client misses 2 heartbeats the connection is closed and the front-end should retry with exponential backoff (e.g. 1s, 3s, 5s...).
- Channels are path-based; reconnecting clients should re-use the same path to resubscribe (`ws://host:4070/run-results/<sessionId>`).
