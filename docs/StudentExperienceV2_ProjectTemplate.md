# Student Experience V2.0 – GitHub Project Template

## 1. Project Setup

- **Project name**: `Student Experience V2.0`
- **Columns**: `Backlog`, `In Progress`, `Review`, `QA`, `Done`
- **Milestones**
  - `M1 – Judge Feedback & Effects`
  - `M2 – Course Map & Hints`
  - `M3 – Dual Editor & Offline`
  - `M4 – Achievements & Audio`
  - `M5 – UI/UX Polish`
- **Labels**
  - `area:frontend`
  - `area:backend`
  - `area:design`
  - `type:feature`
  - `type:api`
  - `type:ux`
  - `priority:high`
  - `blocked`

## 2. Issue Template (Markdown)

```
## Summary
- [ ] Feature parity
- [ ] Telemetry added (if applicable)

## Goals
-

## Acceptance Criteria
- [ ]

## Technical Notes
-

## Dependencies
-

## Testing
- Manual:
- Automated:

## Rollout / Analytics
-
```

## 3. Issue Backlog

| ID   | Title                              | Milestone                     | Labels                                          | Owner Hint      |
| ---- | ---------------------------------- | ----------------------------- | ----------------------------------------------- | --------------- |
| CM-1 | Build Course Map component         | M2 – Course Map & Hints       | `area:frontend`, `type:feature`                 | Frontend        |
| CM-2 | Define course node models          | M2 – Course Map & Hints       | `area:frontend`, `area:backend`, `type:api`     | Shared          |
| CM-3 | Expose course map API              | M2 – Course Map & Hints       | `area:backend`, `type:api`                      | Backend         |
| CM-4 | Merge student progress with map    | M2 – Course Map & Hints       | `area:frontend`, `type:feature`                 | Frontend        |
| CM-5 | Course map node interaction states | M2 – Course Map & Hints       | `area:frontend`, `type:ux`                      | Frontend        |
| CM-6 | Map animations & tooltips          | M5 – UI/UX Polish             | `area:frontend`, `type:ux`                      | Frontend/UI     |
| ED-1 | Integrate Monaco editor            | M3 – Dual Editor & Offline    | `area:frontend`, `type:feature`                 | Frontend        |
| ED-2 | Integrate Blockly editor           | M3 – Dual Editor & Offline    | `area:frontend`, `type:feature`                 | Frontend        |
| ED-3 | Editor mode toggle & sync          | M3 – Dual Editor & Offline    | `area:frontend`, `type:feature`                 | Frontend        |
| ED-4 | Auto-save to local storage         | M3 – Dual Editor & Offline    | `area:frontend`, `type:feature`                 | Frontend        |
| ED-5 | Reference diff highlighting        | M3 – Dual Editor & Offline    | `area:frontend`, `type:feature`                 | Frontend        |
| JR-1 | Enhance execute service            | M1 – Judge Feedback & Effects | `area:backend`, `type:api`                      | Backend         |
| JR-2 | Standardise judge payload          | M1 – Judge Feedback & Effects | `area:backend`, `type:api`                      | Backend         |
| JR-3 | Result panel UI                    | M1 – Judge Feedback & Effects | `area:frontend`, `type:feature`                 | Frontend        |
| JR-4 | XP celebration flow                | M1 – Judge Feedback & Effects | `area:frontend`, `type:ux`                      | Frontend/UI     |
| JR-5 | Failure messaging UX               | M1 – Judge Feedback & Effects | `area:frontend`, `type:ux`                      | Frontend        |
| HT-1 | Extend hints in curriculum JSON    | M2 – Course Map & Hints       | `area:backend`, `type:api`                      | Backend/Content |
| HT-2 | Hint panel component               | M2 – Course Map & Hints       | `area:frontend`, `type:feature`                 | Frontend        |
| HT-3 | Hint usage limits                  | M2 – Course Map & Hints       | `area:frontend`, `type:feature`                 | Frontend        |
| HT-4 | Hint analytics endpoint            | M2 – Course Map & Hints       | `area:backend`, `type:api`                      | Backend         |
| XP-1 | Achievements API module            | M4 – Achievements & Audio     | `area:backend`, `type:api`                      | Backend         |
| XP-2 | Update XP on pass                  | M4 – Achievements & Audio     | `area:frontend`, `type:feature`                 | Frontend        |
| XP-3 | Profile XP display                 | M4 – Achievements & Audio     | `area:frontend`, `type:feature`                 | Frontend        |
| XP-4 | Pass animation component           | M4 – Achievements & Audio     | `area:frontend`, `type:ux`                      | Frontend/UI     |
| FX-1 | Success audio integration          | M4 – Achievements & Audio     | `area:frontend`, `type:ux`                      | Frontend/UI     |
| FX-2 | Failure audio integration          | M4 – Achievements & Audio     | `area:frontend`, `type:ux`                      | Frontend/UI     |
| FX-3 | Framer Motion transitions          | M5 – UI/UX Polish             | `area:frontend`, `type:ux`                      | Frontend/UI     |
| LS-1 | Persist code locally               | M3 – Dual Editor & Offline    | `area:frontend`, `type:feature`                 | Frontend        |
| LS-2 | Restore previous session           | M3 – Dual Editor & Offline    | `area:frontend`, `type:feature`                 | Frontend        |
| LS-3 | Resilient judge reconnection       | M3 – Dual Editor & Offline    | `area:frontend`, `area:backend`, `type:feature` | Shared          |
| FL-1 | Auto navigate to next level        | M5 – UI/UX Polish             | `area:frontend`, `type:feature`                 | Frontend        |
| FL-2 | “Retry level” UX                   | M5 – UI/UX Polish             | `area:frontend`, `type:feature`                 | Frontend        |
| FL-3 | Breadcrumb navigation              | M5 – UI/UX Polish             | `area:frontend`, `type:ux`                      | Frontend        |
| UI-1 | Theme system per language          | M5 – UI/UX Polish             | `area:frontend`, `type:ux`                      | Frontend/UI     |
| UI-2 | Typography audit                   | M5 – UI/UX Polish             | `area:frontend`, `type:ux`                      | Frontend/UI     |
| UI-3 | Homepage banner enhancements       | M5 – UI/UX Polish             | `area:frontend`, `type:feature`                 | Frontend/UI     |

Add cross-cutting tasks like QA, analytics dashboard updates, and localisation as needed.

## 4. Automation Suggestions

- Enable `auto-add to project` workflow using label `student-experience-v2`.
- Configure issue form to assign milestone/labels by default.
- Create CI checklist for editor integration (lint, typecheck, key tests).
