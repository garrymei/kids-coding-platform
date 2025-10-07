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
