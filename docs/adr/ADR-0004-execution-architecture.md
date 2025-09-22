# ADR 0004: Execution Architecture for Code Sandbox

- Status: Accepted
- Date: 2025-09-22

## Context

Students submit Python snippets that must run safely with CPU/memory limits, deterministic timeouts, and no network access. We need to support burst concurrency while keeping the developer experience manageable on laptops.

## Decision

Implement a **Docker-based executor pool** (`server/executor`) backed by Redis queueing. Each job spins up an isolated container with cgroup limits, and the system falls back to a local in-process sandbox when Docker is unavailable (configurable via env flags).

## Consequences

- Provides strong isolation for untrusted code (namespaced FS, disabled networking, short-lived containers).
- Queue/worker model enables controlled concurrency and instrumentation (trace IDs, duration, exit codes).
- Adds dependencies on Docker and Redis for full functionality; documentation and fallback paths reduce friction for newcomers.
