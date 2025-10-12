# Student Experience V2.0 – Team Task Allocation

| Stream                               | Focus                                                                        | Key Deliverables                    | Primary Owners                                   | Supporting Roles                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| Frontend – Course Map & Navigation   | Visual progression map, interactive nodes, breadcrumbs, retry/next flows     | CM-1/4/5/6, FL-1/2/3                | Frontend engineers (React)                       | UI/UX designer for map layout & theming; QA for multi-device coverage |
| Frontend – Editor Experience         | Monaco + Blockly integration, mode switching, diffing, local persistence     | ED-1/2/3/4/5, LS-1/2                | Frontend engineers with Blockly/Monaco expertise | DevOps for asset bundling, QA for autosave & cross-browser validation |
| Frontend – Feedback & Celebrations   | Result panel, XP animation, audio hooks, confetti, Framer Motion transitions | JR-3/4/5, XP-2/4, FX-1/2/3          | Frontend/UI engineers                            | Audio designer for sound assets; QA for performance of animations     |
| Backend – Curriculum & Progress      | Course map API, progress merge, hint consumption tracking                    | CM-3, CM-4 (API side), HT-4, JR-1/2 | Backend engineers (NestJS/Prisma)                | Data analyst for telemetry schema; Frontend for contract alignment    |
| Backend – Achievements & Persistence | XP ledger, level thresholds, badge/pet logic, judge integration              | XP-1, JR-2 (XP fields), LS-3        | Backend engineers                                | Product owner for XP curve tuning; QA for migration testing           |
| Content & Curriculum                 | Update level JSON with hints, tooltip metadata, map positions                | HT-1, CM-6 (content), UI-3 (copy)   | Curriculum/content team                          | UX writer for hint tone; Localization if multilingual                 |
| UI/UX & Visual Design                | Theme system, typography, icons, animations guidelines, pet/badge art        | UI-1/2/3, XP-4, JR-4                | UI/UX designers, motion designer                 | Frontend for implementation feasibility; Audio for timing alignment   |
| QA & Release                         | Regression plans, scenario coverage, telemetry validation, rollout checklist | Cross-cutting                       | QA engineers                                     | All teams supply test cases; DevOps for monitoring setup              |

## Collaboration Rhythm

- **Weekly Sync**: Review milestone burndown (Product + FE + BE + Design).
- **Design Critique**: Twice per milestone for map/editor/animation flows.
- **Playtests**: End of each milestone with real students or internal proxies.

## Additional Notes

- Maintain shared tracking doc for hint localisation and XP tuning decisions.
- Coordinate with DevOps for feature flag rollout (e.g., enable Course Map per cohort).
- Ensure analytics events (`judge_result`, `hint_view`, `xp_update`) are documented for data team.
