# Code Review Checklist (Excerpt)

1. **Security & Privacy**
   - [ ] Validate API handlers enforce role-based scopes (student/parent/teacher separation).
   - [ ] Confirm storage of PII aligns with [Safety Baseline](./safety-baseline.md) (no accidental logging of names/emails).

2. **Content Moderation Hooks**
   - [ ] New UGC entry points integrate with automated screening pipelines (keyword/image filters).
   - [ ] Reviewers notified when content requires manual moderation (per Safety Baseline SLAs).

3. **Logging & Observability**
   - [ ] Structured logs include `traceId`, `userId`, and avoid leaking secrets.
   - [ ] Errors are surfaced to monitoring (Sentry/alerts) when applicable.

4. **DX & Tests**
   - [ ] `pnpm lint` / `pnpm test` pass locally.
   - [ ] Updated documentation (PRD/Design/Policy) where behaviour changes.

> Full policy details: see [Safety Baseline & Content Policy](./safety-baseline.md).
