# ADR 0003: Select Primary Database

- Status: Accepted
- Date: 2025-09-22

## Context

We require relational consistency for user accounts, roles, learning progress, and audit logs. The datastore must support JSON fields, strong ACID guarantees, and run locally via Docker for contributors.

## Decision

Use **PostgreSQL 16** as the primary relational database. Schema migrations are managed by Prisma (`packages/api/prisma`). Local development spins up Postgres via `docker/docker-compose.db.yml`.

## Consequences

- Leverages mature ecosystem (Prisma client, analytics tooling, hosted options such as RDS/Neon).
- Ensures transactional integrity for cross-tenant data (student/parent/teacher relationships).
- Requires operational planning for backups and connection pooling, but fits existing team expertise.
