import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { LoggerService } from '../common/services/logger.service';

@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly prometheusService: PrometheusService,
    private readonly logger: LoggerService
  ) {}

  /**
   * 获取Prometheus指标
   * GET /metrics
   */
  @Get()
  async getMetrics(): Promise<string> {
    try {
      this.logger.info('Metrics endpoint accessed');
      
      const metrics = await this.prometheusService.getMetrics();
      
      return metrics;
    } catch (error) {
      this.logger.error('Failed to get metrics', { error });
      throw error;
    }
  }

  /**
   * 获取系统状态
   * GET /metrics/status
   */
  @Get('status')
  async getSystemStatus(): Promise<{
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    version: string;
    platform: string;
    nodeVersion: string;
  }> {
    try {
      const status = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.env.APP_VERSION || '1.0.0',
        platform: process.platform,
        nodeVersion: process.version,
      };

      this.logger.info('System status requested', { status });

      return status;
    } catch (error) {
      this.logger.error('Failed to get system status', { error });
      throw error;
    }
  }
}
