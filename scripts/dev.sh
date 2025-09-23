#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "${SCRIPT_DIR}/.." && pwd)

trap 'exit 0' INT

# Ensure dependencies are installed
pnpm install

# Start database (idempotent)
docker compose -f "${REPO_ROOT}/docker/docker-compose.db.yml" up -d

echo "Starting all services..."

cleanup() {
  echo "\nStopping dev processes..."
  if [[ -n "${API_PID:-}" ]]; then kill "$API_PID" 2>/dev/null || true; fi
  if [[ -n "${EXEC_PID:-}" ]]; then kill "$EXEC_PID" 2>/dev/null || true; fi
  if [[ -n "${WS_PID:-}" ]]; then kill "$WS_PID" 2>/dev/null || true; fi
  if [[ -n "${STUDENT_PID:-}" ]]; then kill "$STUDENT_PID" 2>/dev/null || true; fi
  if [[ -n "${PARENT_PID:-}" ]]; then kill "$PARENT_PID" 2>/dev/null || true; fi
  if [[ -n "${TEACHER_PID:-}" ]]; then kill "$TEACHER_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

# Start backend services
echo "Starting API service..."
pnpm --filter @kids/api start:dev &
API_PID=$!

echo "Starting executor service..."
pnpm --filter @kids/executor start:dev &
EXEC_PID=$!

echo "Starting WebSocket service..."
pnpm --filter @kids/websocket dev &
WS_PID=$!

# Start frontend apps
echo "Starting student app..."
pnpm --filter student-app dev &
STUDENT_PID=$!

echo "Starting parent app..."
pnpm --filter parent-app dev &
PARENT_PID=$!

echo "Starting teacher app..."
pnpm --filter teacher-app dev &
TEACHER_PID=$!

echo ""
echo "🚀 All services started!"
echo "📱 Student App: http://localhost:5173"
echo "👨‍👩‍👧‍👦 Parent App: http://localhost:5174" 
echo "👨‍🏫 Teacher App: http://localhost:5175"
echo "🔌 API: http://localhost:3000"
echo "📡 WebSocket: ws://localhost:3001"
echo "📊 Prisma Studio: http://localhost:5555"
echo ""
echo "Press Ctrl+C to stop all services"

wait
