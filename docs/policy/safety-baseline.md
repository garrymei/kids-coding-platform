# Safety Baseline & Content Policy

_Last updated: 2025-09-22_

This document establishes the minimum safety measures for protecting minors, safeguarding personal data, and moderating user-generated content on the Kids Coding Platform. It applies to all production and staging environments.

---

## 1. Account & Data Isolation Strategy

### 1.1 User Roles & Tenancy Boundaries

| Role       | Primary Permissions                                    | Data Visibility                                                   |
|------------|---------------------------------------------------------|-------------------------------------------------------------------|
| Student    | Create/run lessons, submit challenges, publish drafts   | Only own profile, progress, submissions, and feedback             |
| Parent     | Monitor linked student accounts, view progress reports  | Read-only access to children linked via verified invitation codes |
| Teacher    | Manage classrooms, assign tasks, review student work    | Access limited to students explicitly enrolled in their class     |
| Admin/Ops  | Platform operations, support, content moderation        | Full access; actions logged and dual-controlled                   |

- **Isolation principle:** every API request resolves the caller’s role and `tenant_scope` (student ID list for parent/teacher). Database queries must include scope filters to avoid cross-tenant leakage.
- **Linking workflow:** parent ↔ student relationships require out-of-band verification (e.g., class code or approval via teacher). Teacher ↔ student assignments happen through classroom rosters controlled by admins.
- **Sensitive fields (PII)** such as student real names, guardianship details, and contact info are stored encrypted at rest. Access to raw PII is restricted to admin-only APIs.

### 1.2 Session & Authentication Controls

- JWT tokens carry `role`, `user_id`, and `trace_id`; refresh tokens stored server-side with short TTL (<= 7 days).
- Multifactor authentication recommended for teacher/admin accounts (email OTP or authenticator app).
- Automatic logout after 30 minutes of inactivity on shared devices (classroom tablets, kiosks).

### 1.3 Data Residency & Backups

- Primary database cluster: PostgreSQL with daily encrypted backups retained for 30 days.
- Object storage (user uploads, avatars, project assets) segregated by role, with read-only signed URLs for sharing.
- Minors’ data stored within jurisdiction that enforces COPPA/CCPA-equivalent protections.

---

## 2. Content Moderation Strategy

### 2.1 Scope

Covers student projects, code snippets, comments, avatar uploads, and classroom messages.

### 2.2 Automated Screening

1. **Code & Text Filtering**
   - Run UGC through a keyword / NLP classifier for profanity, self-harm, bullying, and PII leakage.
   - Block submissions containing `http://`/`https://` links or detected email/phone patterns unless teacher-approved.
   - Python execution sandbox disallows `import` for unsafe modules (already enforced by whitelist).

2. **Media Validation**
   - Avatars and image uploads pass through an image-moderation service for NSFW detection.
   - Reject files exceeding size limits or non-whitelisted formats.

3. **Spam & Abuse Rate Limits**
   - Per-user throttle: max 5 comments/minute and 20 project publishes/day.
   - Reputation system to flag sudden spikes in identical submissions.

### 2.3 Human Review Workflow

- **Escalation queue:** automated blockers place content into `pending_review` table with `trace_id`, uploader, classifier score, and snippet preview.
- **Moderation SLAs:**
  - High severity (explicit, self-harm): respond within 2 hours.
  - Medium severity (bullying, personal data leaks): respond within 24 hours.
  - Low severity (spam, formatting): respond within 72 hours.
- **Actions available to moderators:** approve, edit (redact PII), reject (content removed), or escalate to policy lead.
- **Audit requirements:** every decision stores moderator ID, timestamp, reason code, and optional notes.

### 2.4 Classroom-Level Controls

- Teachers can enable "pre-moderation" for younger cohorts (content only visible after teacher approval).
- Parents receive weekly digests summarizing their child’s public activity; they can request removal.
- Repeat offenders (students or external collaborators) trigger progressive discipline (warnings, temporary suspension, permanent ban).

---

## 3. Logging & Audit Policy

### 3.1 Structured Logging

- All backend services emit JSON logs with fields: `timestamp`, `level`, `service`, `traceId`, `spanId`, `userId`, `msg`, `http.method`, `http.path`, `statusCode`, `durationMs`.
- Logs are shipped to centralized storage (e.g., OpenSearch/Elasticsearch) with retention configured below.

### 3.2 Retention & Access

| Log Type             | Retention | Storage                   | Access Control                               |
|----------------------|-----------|---------------------------|----------------------------------------------|
| API request logs     | 90 days   | Central log cluster       | Read-only for SRE + Security team            |
| Executor sandbox logs| 30 days   | Cold storage (cheaper tier)| Limited to SRE; PII redacted                 |
| Moderation decisions | 1 year    | Postgres `moderation_audit`| Moderation team + Compliance                  |
| Authentication events| 1 year    | Audit log warehouse       | Security + Compliance; immutable append-only |

Logs containing personal data must be redacted at ingestion (mask emails, tokens). Queries for investigations require ticket number and are recorded in the audit trail.

### 3.3 Alerting & Anomaly Detection

- Failed login spikes trigger alerts (threshold: >5 failures/min per account or >50/min globally).
- Executor timeouts >10% over rolling 15 minutes escalate to on-call engineer.
- Moderation queue backlog >48 hours sends reminder to moderation lead.

### 3.4 Incident Response

- Security incidents follow a 4-step playbook: triage → contain → remediate → communicate.
- Response team includes engineering, policy lead, and legal liaison when minors’ data exposure is suspected.
- Post-incident review within 7 days; action items tracked in issue tracker.

---

## 4. Compliance & Continuous Improvement

- Review this baseline quarterly; update for new regulations (e.g., EU Child Safety codes).
- Conduct annual third-party audits for data protection and content moderation practices.
- Provide transparency reports (biannual) summarizing takedowns, reports, and response times.

---

## Appendix: Implementation Checklist

- [x] Role-based access control implemented in API middleware.
- [x] Docker executor logging enriched with trace/user metadata.
- [ ] Deploy automated moderation pipeline (NLP classifier + image detection).
- [ ] Build moderator dashboard for manual review.
- [ ] Automate log shipping & retention policies in infrastructure-as-code.
