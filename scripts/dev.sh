#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "${SCRIPT_DIR}/.." && pwd)

trap 'exit 0' INT

# Ensure dependencies are installed
pnpm install

# Start database (idempotent)
docker compose -f "${REPO_ROOT}/docker/docker-compose.db.yml" up -d

echo "Starting API, executor, and student app..."

cleanup() {
  echo "\nStopping dev processes..."
  if [[ -n "${API_PID:-}" ]]; then kill "$API_PID" 2>/dev/null || true; fi
  if [[ -n "${EXEC_PID:-}" ]]; then kill "$EXEC_PID" 2>/dev/null || true; fi
  if [[ -n "${WEB_PID:-}" ]]; then kill "$WEB_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

pnpm --filter @kids/api start:dev &
API_PID=$!

pnpm --filter @kids/executor start:dev &
EXEC_PID=$!

pnpm --filter student-app dev &
WEB_PID=$!

wait
