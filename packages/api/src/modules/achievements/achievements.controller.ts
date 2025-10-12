import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

interface UpdateAchievementsBody {
  userId?: string;
  xpDelta: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('profile')
  profile(@Query('userId') userId = 'demo') {
    return this.achievementsService.getProfile(userId);
  }

  @Get()
  list(@Query('userId') userId = 'demo') {
    return this.achievementsService.listAchievements(userId);
  }

  @Post('update')
  update(@Body() body: UpdateAchievementsBody) {
    const userId = body.userId ?? 'demo';
    return this.achievementsService.updateUser(userId, {
      xpDelta: body.xpDelta,
      reason: body.reason,
      metadata: body.metadata,
    });
  }
}
