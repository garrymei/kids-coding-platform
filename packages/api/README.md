# Kids Coding Platform · API Service

NestJS service that powers core backend capabilities for the Kids Coding Platform. The service exposes REST endpoints with OpenAPI docs, integrates with PostgreSQL through Prisma, emits structured JSON logs, and issues JWTs for role-based access control.

## Quickstart

```bash
pnpm install
docker compose -f ../../docker/docker-compose.db.yml up -d
pnpm --filter @kids/api prisma migrate deploy
pnpm --filter @kids/api start:dev
```

Visit:

- `GET /health` – readiness probe (verifies DB connectivity)
- `GET /ready` – lightweight readiness for load balancers
- `GET /docs` – Swagger UI with authenticated routes
- `GET /metrics` – Prometheus metrics (request duration, counters)
- `POST /auth/login` – obtain JWT access token

Environment variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://kids:kids@localhost:5432/kids` |
| `JWT_SECRET` | Symmetric signing secret | `dev-secret` |
| `SENTRY_DSN` | Optional error-reporting DSN | _unset_ |
| `LOG_LEVEL` | Pino log level | `info` |
| `LOG_PRETTY` | Pretty-print JSON logs | `false` |
| `LOG_FILE` | Structured log file path | `logs/api.log` |
| `LOG_TO_FILE` | Disable file logging when `false` | `true` |

## Module Overview

- `modules/auth` – login flow, JWT strategy, `@Roles()` decorator & guard
- `modules/users` – protected user listings for admin/teacher roles
- `modules/courses` – public preview plus role-gated management endpoint
- `prisma` – shared Prisma client wrapper used across modules

## Observability

- Structured logs (`pino`) include `level`, `msg`, `traceId`, `userId`, and `execId` when available.
- Prometheus metrics exposed at `/metrics` capture request counts/duration.
- Optional Sentry integration is activated automatically when `SENTRY_DSN` is provided; uncaught exceptions and rejections are captured.

## Testing

```bash
pnpm --filter @kids/api lint   # ESLint (fixes applied in-place)
pnpm --filter @kids/api test   # unit tests
pnpm --filter @kids/api test:e2e # e2e with mocked Prisma health check
```

## Migrations

Run `pnpm db:migrate` from the repository root to execute `prisma migrate deploy`, creating the baseline `users`, `roles`, and `sessions` tables required by the auth flow.
