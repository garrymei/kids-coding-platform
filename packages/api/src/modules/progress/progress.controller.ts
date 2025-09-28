import { Controller, Post, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission, PermissionType } from '../auth/decorators/permissions.decorator';
import { RealMetricsService } from '../metrics/services/real-metrics.service';

@ApiTags('progress')
@Controller('progress')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProgressController {
  private readonly logger = new Logger(ProgressController.name);

  constructor(private readonly metricsService: RealMetricsService) {}

  @Post('events')
  @RequirePermission(PermissionType.EVENT_RECORDING)
  @ApiOperation({ summary: '记录学习进度事件' })
  @ApiResponse({ status: 201, description: '事件记录成功' })
  async recordProgressEvent(
    @Body() body: {
      levelId: string;
      passed: boolean;
      timeMs?: number;
    },
    @Request() req,
  ): Promise<{ success: boolean }> {
    const studentId = req.user.id;
    
    this.logger.log(`Recording progress event for student ${studentId}, level ${body.levelId}, passed: ${body.passed}`);

    try {
      await this.metricsService.recordLearnEvent(
        studentId,
        body.levelId,
        body.passed,
        body.timeMs,
      );

      this.logger.log(`Successfully recorded progress event for student ${studentId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to record progress event:', error);
      throw error;
    }
  }
}
