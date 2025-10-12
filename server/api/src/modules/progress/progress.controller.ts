import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CurriculumService } from '../curriculum/curriculum.service';

@Controller('progress')
export class ProgressController {
  constructor(
    private readonly svc: ProgressService,
    private readonly curriculum: CurriculumService,
  ) {}

  @Post('update')
  async update(@Body() body: any) {
    const { userId = 'demo', language, game, level, durationMs } = body;
    return this.svc.update(userId, language, game, level, { level, durationMs });
  }

  @Get('next')
  async next(
    @Query('userId') userId = 'demo',
    @Query('language') language: string,
    @Query('game') game: string,
  ) {
    const prog = this.svc.get(userId, language, game);
    const gameJson = await this.curriculum.readGame(language, game);
    if (!gameJson) return { nextLevel: 1, finished: false };

    const maxLevel = Math.max(...gameJson.levels.map((x: any) => x.level));
    const now = prog?.level ?? 0;
    const next = Math.min(now + 1, maxLevel);
    const finished = next === maxLevel && prog?.level === maxLevel;

    return { nextLevel: next, finished, currentLevel: now };
  }

  @Get('status')
  async status(
    @Query('userId') userId = 'demo',
    @Query('language') language: string,
    @Query('game') game: string,
  ) {
    const record = this.svc.get(userId, language, game);
    const completed = this.svc.getCompletedLevels(userId, language, game);
    return {
      currentLevel: record?.level ?? 0,
      completedLevels: completed,
      lastPassedAt: record?.passedAt,
    };
  }

  @Get('hints')
  async hintUsage(
    @Query('userId') userId = 'demo',
    @Query('language') language: string,
    @Query('game') game: string,
    @Query('level') levelStr: string,
  ) {
    const level = Number.parseInt(levelStr ?? '', 10);
    const normalizedLevel = Number.isInteger(level) && level > 0 ? level : 1;
    return this.svc.getHintUsage(userId, language, game, normalizedLevel);
  }

  @Post('hints')
  async recordHint(
    @Body()
    body: {
      userId?: string;
      language: string;
      game: string;
      level: number;
      hintIndex: number;
    },
  ) {
    const { userId = 'demo', language, game, level, hintIndex } = body;
    return this.svc.recordHintView({ userId, language, game, level, hintIndex });
  }
}
