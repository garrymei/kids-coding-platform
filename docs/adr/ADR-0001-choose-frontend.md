# ADR 0001: Choose Frontend Stack for Student Experience

- Status: Accepted
- Date: 2025-09-22

## Context

We need a rapid feedback development environment for the student-facing interface. The UI depends on Blockly integration, live preview of execution results, and collaboration with shared UI packages inside a pnpm monorepo. We experimented with cross-platform scaffolds (Taro) but initial setup friction slowed progress and conflicted with existing workspace tooling.

## Decision

Adopt **React + Vite (React 19, TypeScript)** for the student web/H5 experience. The project lives under `apps/student-app`, consumes internal packages (`@kids/ui-kit`, `@kids/blockly-extensions`), and uses Vite dev/build pipelines.

## Consequences

- Fast Hot Module Replacement and minimal configuration allow the team to iterate quickly on Blockly/lab features.
- Web-first scaffold keeps bundle size manageable and aligns with future SSR/static export options.
- Native app shells (mini-programs / RN) will require a separate adapter in later milestones; this decision favors speed over immediate code sharing with other clients.
