# Kids Coding Platform · Addon (Backend + Frontend glue)

Date: 2025-10-07

This addon provides:

- **Backend (NestJS)** modules: `curriculum`, `judge`, `execute`
- **Shared DTOs** and strategies for `api_events`, `svg_path_similarity`, `unit_tests`
- **Frontend**: framework-agnostic API helpers and a demo React page (can adapt to Next.js/Taro)

Recommended monorepo placement:

```
server/api/src/modules/{
  curriculum/
  judge/
  execute/
}
server/api/src/common/dto/
apps/web/src/{
  components/StudyRunner.tsx
  services/curriculum.ts
  services/judge.ts
}
```

## Backend integration (NestJS)

1. Copy `server/api/src/modules/*` and `server/api/src/common` into your Nest API.
2. Register modules in `AppModule`:

```ts
import { Module } from '@nestjs/common';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { JudgeModule } from './modules/judge/judge.module';
import { ExecuteModule } from './modules/execute/execute.module';

@Module({
  imports: [CurriculumModule, JudgeModule, ExecuteModule],
})
export class AppModule {}
```

3. Place curriculum JSON (from the Levels Pack you downloaded) under:

```
server/api/src/data/curriculum/<language>/<game>.json
```

4. Start API:

```
pnpm --filter api dev
# or npm run start:dev
```

## Frontend integration

1. Copy `apps/web/src/components/StudyRunner.tsx` and `apps/web/src/services/*`.
2. Route a page to:

```
/learn/:language/:game/:level
```

and render `<StudyRunner />`.

3. The StudyRunner will:

- load the level from `/api/curriculum/:language/:game/:level`
- inject `starter_code` to editor
- allow "Run" -> calls `/api/execute` (mock) and `/api/judge`
- show "参考答案" and "下一关"（若通过）

## Security & Sandbox

- The `execute` module here is **mocked** for now. Replace with your containerized sandbox.
- Judge strategies are safe (pure computation + server-side checks).
- For Turtle drawing you'll need to log drawing commands on client and submit as `events`.

---
