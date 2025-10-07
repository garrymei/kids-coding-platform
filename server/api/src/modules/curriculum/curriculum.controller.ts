import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { Response } from 'express';

@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly svc: CurriculumService) {}

  @Get(':language/:game')
  async getGame(@Param('language') language: string, @Param('game') game: string) {
    const data = await this.svc.readGame(language, game);
    if (!data) throw new NotFoundException('Game not found');
    return data;
  }

  // 新增：仅返回参考答案（避免全量下发，支持按需获取）
  // 注意：此路由必须放在 :language/:game/:level 之前，否则会被误匹配
  @Get(':language/:game/:level/reference')
  async getReference(
    @Param('language') language: string,
    @Param('game') game: string,
    @Param('level') level: string,
  ) {
    const data = await this.svc.readGame(language, game);
    if (!data) throw new NotFoundException('Game not found');
    const lv = data.levels.find((x: any) => String(x.level) === String(level));
    if (!lv) throw new NotFoundException('Level not found');
    return { reference_solution: lv.reference_solution ?? '' };
  }

  @Get(':language/:game/:level')
  async getLevel(
    @Param('language') language: string,
    @Param('game') game: string,
    @Param('level') level: string,
  ) {
    const data = await this.svc.readGame(language, game);
    if (!data) throw new NotFoundException('Game not found');
    const lv = data.levels.find((x: any) => String(x.level) === String(level));
    if (!lv) throw new NotFoundException('Level not found');
    return lv;
  }
}
