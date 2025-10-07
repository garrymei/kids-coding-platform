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
}
