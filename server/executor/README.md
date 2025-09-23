# Executor Service

Sandbox microservice used to run user-submitted Python snippets in isolated Docker containers with Redis-backed queuing, static safety checks, and resource limits.

## Architecture

- **HTTP API** `POST /execute` – performs Python AST validation (import/builtin allowlist) before enqueuing a job in Redis (`executor:tasks`).
- **Worker pool** (default concurrency = 5) pulls jobs via `BRPOP`, spins up a short-lived Docker container, and streams stdout/stderr/metrics back.
- **Results** are delivered to the original request once execution completes. Fallback to the in-process sandbox runner is available when Docker is unreachable.
- **Logging** records `containerId`, runtime duration, exit code, timeout events, and resource usage per test case.

## Request / Response

```http
POST /execute
Content-Type: application/json

{
  "language": "python",
  "source": "n = int(input())\nprint(n * 2)",
  "tests": [
    { "stdin": "5\n", "expectedStdout": "10\n" },
    { "stdin": "2\n", "timeoutMs": 1500, "expectedStdout": "4\n" }
  ]
}
```

Successful response:

```json
{
  "jobId": "05c5a222-c2f4-4c12-bf54-7b7b1dd0b9a3",
  "ok": true,
  "results": [
    {
      "stdout": "10\n",
      "stderr": "",
      "exitCode": 0,
      "timedOut": false,
      "signal": null,
      "durationMs": 742,
      "usage": { "cpuSeconds": 0.042, "memoryBytes": 18841600 },
      "expectedStdout": "10\n",
      "passed": true,
      "containerId": "9c8bd6d1d7c1"
    },
    {
      "stdout": "4\n",
      "stderr": "",
      "exitCode": 0,
      "timedOut": false,
      "signal": null,
      "durationMs": 713,
      "usage": { "cpuSeconds": 0.039, "memoryBytes": 16777216 },
      "expectedStdout": "4\n",
      "passed": true,
      "containerId": "2d402c5f44e2"
    }
  ]
}
```

## Running locally

```bash
# 1. Start Redis (example)
docker run --rm -it -p 6379:6379 redis:7-alpine

# 2. Ensure Docker daemon is available (for container execution)

# 3. Start the executor service
pnpm --filter @kids/executor start:dev
```

If Docker is unavailable the service falls back to the in-process runner (set `EXECUTOR_LOCAL_FALLBACK=false` to disable).

## Configuration

Environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `EXECUTOR_PORT` | `4060` | HTTP server port |
| `EXECUTOR_REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `EXECUTOR_QUEUE_KEY` | `executor:tasks` | Redis list key for queued jobs |
| `EXECUTOR_MAX_CONCURRENCY` | `5` | Number of worker loops / concurrent containers |
| `EXECUTOR_DOCKER_IMAGE` | `python:3.12-alpine` | Base image used to run code |
| `EXECUTOR_MEM_LIMIT` | `268435456` | Memory limit (bytes) applied to Docker containers and fallback runner |
| `EXECUTOR_NANO_CPUS` | `1000000000` | CPU quota (`1e9` ≈ 1 vCPU) |
| `EXECUTOR_TIMEOUT` | `3` | Wall-clock timeout in seconds (converted to ms internally) |
| `EXECUTOR_ALLOWED_MODULES` | `["math","random","statistics"]` | JSON array of permitted Python modules |
| `EXECUTOR_LOCAL_FALLBACK` | `true` | Whether to fall back to in-process runner if Docker is unavailable |
| `DOCKER_SOCKET_PATH` | `/var/run/docker.sock` | Unix socket used by Dockerode |
| `SENTRY_DSN` | _unset_ | Optional error-reporting endpoint |
| `LOG_FILE` | `logs/executor.log` | Structured log file destination |
| `LOG_TO_FILE` | `true` | Disable file logging when set to `false` |

Redis queue names and other behaviour can be customised via the same environment variables used in `src/config.ts`.

### Observability Endpoints

- `GET /health` – verifies Redis connectivity and local fallbacks
- `GET /ready` – lightweight probe that pings Docker
- `GET /metrics` – Prometheus scrape endpoint (includes execution counters/histograms)

## Logs

Structured logs (Pino) are emitted to stdout. Example entry after a container run:

```json
{
  "level": 30,
  "time": 1737600000000,
  "msg": "worker_job_completed",
  "traceId": "8b9f34d2d6a3",
  "userId": "student-123",
  "jobId": "05c5a222-c2f4-4c12-bf54-7b7b1dd0b9a3",
  "workerId": 2,
  "durationMs": 1520,
  "tests": [
    {
      "index": 0,
      "exitCode": 0,
      "timedOut": false,
      "durationMs": 742,
      "passed": true,
      "cpuSeconds": 0.042,
      "memoryBytes": 18841600,
      "containerId": "9c8bd6d1d7c1"
    },
    {
      "index": 1,
      "exitCode": 0,
      "timedOut": false,
      "durationMs": 713,
      "passed": true,
      "cpuSeconds": 0.039,
      "memoryBytes": 16777216,
      "containerId": "2d402c5f44e2"
    }
  ]
}
```

These records can be shipped to your observability stack to audit resource usage and diagnose failures.
