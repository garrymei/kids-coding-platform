# Student Experience V2.0 – Product Requirements

## 1. Overview

- **Vision**: Upgrade the student-facing experience from a functional demo to an engaging, guided learning journey that delivers persistence, feedback, and gamified motivation.
- **Primary Users**: K12 learners using Blockly/Code editors to progress through coding curriculum.
- **Success Criteria**
  - Students can visualise their curriculum progression, understand unlocked/locked levels, and navigate intuitively.
  - End-to-end learning loop is smooth: select level → code → run → receive feedback → earn rewards → unlock next content.
  - Engagement metrics improve (time on task, completion rate) and support team receives fewer “stuck” complaints.

## 2. Scope & Deliverables

- Course Map visualisation with unlock logic and progress integration.
- Dual-mode editor (Blockly ↔ Code) with auto-save and diff assist.
- Unified run/judge results panel with animation, sound, XP integration.
- Tiered hint system with limits and analytics hooks.
- Gamified progression (XP levels, badges/pet evolution).
- Offline persistence, resumable judge runs, and clear navigation controls.
- Visual/audio polish for a cohesive, playful brand.

Out of scope for this iteration:

- Teacher dashboards beyond hint usage analytics.
- Real-time collaborative editing.
- Marketplace / user-generated levels.

## 3. User Journey Summary

1. Launch app → see personalised dashboard with map progress + avatar/pet.
2. Browse course map, inspect level tooltips, enter unlocked level.
3. Choose editor mode, load prior work automatically.
4. Write code / build blocks; switch modes as desired.
5. Run solution → observe Result Panel feedback, sound, XP updates.
6. View hints if needed (limited per day, tracked).
7. On success, celebrate animation, unlock next level, update map and achievements.

## 4. Functional Requirements

### 4.1 Course Map (CM)

- Render curriculum graph per language/game using JSON definitions.
- Display node states (`locked`, `unlocked`, `passed`) with visual differentiation.
- Show level metadata (title, objectives) on hover/tap.
- Handle node click rules (enter level if unlocked, toast otherwise).
- Auto-update when progress API returns new data.

### 4.2 Editor Experience (ED)

- Blockly editor with configured toolbox per level.
- Monaco editor with syntax highlighting for Python & JS, plus diff highlighting when pasting reference solution.
- Bidirectional conversion: Blockly XML ↔ generated JS/Python code.
- Local auto-save every 10s keyed by `language/game/level`.
- Mode toggle persists across sessions.

### 4.3 Judge & Feedback (JR)

- `/api/execute` supports simulated runtime, timeout detection, stdout/stderr capture.
- `/api/judge` returns standard payload `{ pass, score, message, stdout, stderr, timeMs, xpAwarded }`.
- Frontend ResultPanel displays logs, status, timer, XP delta, confetti or failure cues.
- Success triggers `/api/achievements/update` and progress unlock.

### 4.4 Hint System (HT)

- Level JSON supports `hints: Hint[]` with escalating guidance.
- Frontend HintPanel reveals hints sequentially with per-day view cap (default 3).
- Backend records hint consumption via `/api/progress/hints` for analytics.

### 4.5 Achievements & XP (XP)

- Persist XP, levels, badges, and pet state in dedicated tables.
- Define XP curve (e.g., Lv1 0–49, Lv2 50–119, etc.).
- Expose `/api/achievements/profile` & `/api/achievements/update`.
- Profile page shows XP progress bar, current level, badge, pet stage.
- PassAnimation component handles celebration visuals/sfx.

### 4.6 Offline & Resilience (LS)

- Auto-save to `localStorage` and restore on load; provide clear “Load previous work?” prompt.
- Detect websocket/judge disruptions and retry/resume gracefully.

### 4.7 Navigation & UX (FL/UI/FX)

- Next-level auto navigation or “Try again” options.
- Breadcrumb header `Language / Game / Level`.
- Unified colour + typography system by language.
- Framer Motion for transitions; cheer/buzz audio cues.

## 5. Non-Functional Requirements

- **Performance**: Initial map load < 1.5s; judge roundtrip target < 3s; editor responsive on low-end Chromebooks.
- **Accessibility**: WCAG AA colour contrast, keyboard navigation for course map and hints, captions for audio cues.
- **Reliability**: Auto-saves should not block UI; degrade gracefully if backend offline.
- **Security/Privacy**: Mask PII in telemetry, respect child data protection; no hints/XP stored insecurely.

## 6. Data Contracts (High-Level)

- `GET /api/course-map/:lang/:game` → `{ nodes: CourseNode[], edges: Edge[] }`
- `GET /api/progress` → `{ passedLevels: string[], xp: number, level: number }`
- `POST /api/judge` → `{ pass, score, message, stdout, stderr, timeMs, xpAwarded, unlocksNext }`
- `POST /api/achievements/update` → `{ xpDelta, newLevel?, newBadge?, petState? }`
- `POST /api/progress/hints` → `{ levelId, hintIndex }`

Detailed schemas to be captured in OpenAPI once endpoints are final.

## 7. Milestones & Timeline

- **M1 (3 days)**: Judge feedback revamp, animations, sound hooks.
- **M2 (3 days)**: Course map MVP & hint system with analytics.
- **M3 (3 days)**: Dual-mode editor + offline persistence.
- **M4 (2 days)**: Achievements backend + celebratory UX.
- **M5 (2 days)**: UI/UX coherence, theming, polishing.

## 8. Dependencies & Risks

- Requires updated curriculum JSON with hints and map metadata (positions).
- Need audio assets & visual design for badges/pet.
- Blockly ↔ code sync complexity; plan for fallback to code-only if conversion fails.
- XP economy tuning; monitor to avoid grind or over-reward.
- Ensure analytics (hint usage) respects privacy policies.

## 9. Metrics & Analytics

- Completion rate per game/level.
- Average hints consumed per level.
- XP progression velocity.
- Time to first success after failure.
- Editor mode usage ratio (Blockly vs Code).

## 10. Open Questions

- Do we gate hints behind “spend XP” or keep free with limits?
- Should XP awards vary by level difficulty?
- Any parental controls for limiting playtime?
- Need localisation for hint text/UX copy?

## 11. Launch Checklist

- QA across desktop Chrome/Edge + touch devices.
- Regression on judge endpoints and progress persistence.
- Content review for hints and localisation.
- Monitoring dashboards updated (judge response time, hint usage).
- Rollout plan (beta group of classrooms before GA).
