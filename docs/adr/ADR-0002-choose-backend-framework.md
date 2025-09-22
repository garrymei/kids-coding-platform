# ADR 0002: Choose Backend Framework for API Service

- Status: Accepted
- Date: 2025-09-22

## Context

The platform needs a structured HTTP API that integrates with PostgreSQL, supports modular architecture, and offers mature TypeScript support. Requirements include dependency injection, validation, background task hooks, and straightforward observability integrations.

## Decision

Adopt **NestJS (Node.js, TypeScript)** for the API service located at `packages/api`. Logging is provided via `nestjs-pino`, and Prisma will be layered in for data access.

## Consequences

- Nest’s module system accelerates feature teams (auth, lessons, progress tracking) with shared providers.
- Consistent TypeScript stack across front/back reduces cognitive load.
- Slightly higher abstraction overhead compared to minimalist frameworks, but mitigated by CLI tooling and community ecosystem.
