# Executor Service

Sandbox microservice used to run user-submitted Python snippets in isolated Docker containers with Redis-backed queuing and resource limits.

## Architecture

- **HTTP API** `POST /execute` → enqueues a job in Redis (`executor:tasks`).
- **Worker pool** (default concurrency = 5) pulls jobs via `BRPOP`, spins up a short-lived Docker container, and streams stdout/stderr back.
- **Results** are delivered to the original request once execution completes. Fallback to the local (in-process) runner is available when Docker is unreachable.
- **Logging** records `container_id`, runtime duration, exit code, and timeout events.

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
      "expectedStdout": "10\n",
      "passed": true
    },
    {
      "stdout": "4\n",
      "stderr": "",
      "exitCode": 0,
      "timedOut": false,
      "signal": null,
      "expectedStdout": "4\n",
      "passed": true
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

Redis queue names and other behaviour can be customised via the same environment variables used in `src/config.ts`.

## Logs

Structured logs (Pino) are emitted to stdout. Example entry:

```json
{
  "level": 30,
  "time": 1737600000000,
  "msg": "[docker] execution finished",
  "job": "container_execution",
  "containerId": "a1b2c3d4",
  "exitCode": 0,
  "durationMs": 742,
  "timedOut": false
}
```

These records can be shipped to your observability stack to audit resource usage and diagnose failures.
