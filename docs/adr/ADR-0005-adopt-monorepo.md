# ADR 0005: Adopt pnpm Monorepo Structure

- Status: Accepted
- Date: 2025-09-22

## Context

The project spans multiple runtimes (React frontend, NestJS API, executor service, shared UI/Blockly packages). We need dependency hoisting control, fast installs, and the ability to share code via workspaces.

## Decision

Use a **pnpm-based monorepo** rooted at the repository top. Workspace packages live under `apps/`, `packages/`, `server/`, and share TypeScript config (`tsconfig.base.json`). Husky + lint-staged enforce repo-wide lint/format scripts.

## Consequences

- Enables shared packages (`@kids/ui-kit`, `@kids/blockly-extensions`, `@kids/api`) without manual linking.
- Centralizes lint/build scripts and eases CI pipeline configuration.
- Requires team familiarity with pnpm CLI (addressed via Makefile/README onboarding in future tasks).
