import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLoggerService } from '../audit/services/audit-logger.service';
import { ClassManagementService } from './services/class-management.service';
// EnrollmentStatus is now a string enum in the schema

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassesController {
  private readonly logger = new Logger(ClassesController.name);

  constructor(
    private readonly classManagementService: ClassManagementService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  @Post('join')
  async joinClass(@Body() body: { code: string }, @Request() req) {
    const studentId = req.user.id;
    const { code } = body;

    this.logger.log(
      `Student ${studentId} attempting to join class with code: ${code}`,
    );

    try {
      const result = await this.classManagementService.joinClass(
        studentId,
        code,
      );

      // 记录审计日志（与现有接口风格保持一致）
      await this.auditLogger.log({
        actorId: studentId,
        action: 'join_class',
        targetType: 'class',
        targetId: (result as any)?.classId || 'unknown',
        metadata: {
          inviteCode: code,
          timestamp: new Date().toISOString(),
        },
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      this.logger.log(
        `Student ${studentId} requested to join via service with code ${code}`,
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to join class via service:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to join class',
      );
    }
  }

  // 文档别名：POST /classes/join-by-invite-code
  @Post('join-by-invite-code')
  async joinByInviteCode(@Body() body: { code: string }, @Request() req) {
    const studentId = req.user.id;
    const { code } = body;

    this.logger.log(
      `Student ${studentId} attempting to join class with code: ${code} (alias)`,
    );

    try {
      const result = await this.classManagementService.joinClass(
        studentId,
        code,
      );

      await this.auditLogger.log({
        actorId: studentId,
        action: 'join_class',
        targetType: 'class',
        targetId: (result as any)?.classId || 'unknown',
        metadata: {
          inviteCode: code,
          timestamp: new Date().toISOString(),
        },
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      this.logger.log(
        `Student ${studentId} requested to join via service (alias) with code ${code}`,
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to join class via service (alias):', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to join class',
      );
    }
  }
}
