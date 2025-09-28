import { Controller, Get, Post, Param, Body, Query, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { ConsentActionDto, ConsentResponseDto, ConsentRequestDto, ConsentListQueryDto } from './dto/consent.dto';
import { LoggerService } from '../../common/services/logger.service';

@Controller('consents')
export class ConsentController {
  constructor(
    private readonly consentService: ConsentService,
    private readonly logger: LoggerService
  ) {}

  /**
   * 创建授权请求
   * POST /consents
   */
  @Post()
  async createConsentRequest(
    @Body() request: ConsentRequestDto,
    @Request() req: any
  ): Promise<ConsentResponseDto> {
    try {
      this.logger.info('Creating consent request', {
        studentId: request.studentId,
        parentId: request.parentId,
        note: request.note,
        cid: this.generateCorrelationId(),
      });

      const result = await this.consentService.createConsentRequest(request);

      this.logger.info('Consent request created successfully', {
        consentId: result.id,
        status: result.status,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to create consent request', { error, request });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create consent request',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 学生同意授权请求
   * POST /consents/:requestId/approve
   */
  @Post(':requestId/approve')
  async approveConsent(
    @Param('requestId') requestId: string,
    @Body() action: ConsentActionDto,
    @Request() req: any
  ): Promise<ConsentResponseDto> {
    try {
      const studentId = req.user?.id || req.headers['x-student-id'] || 'stu_1';

      this.logger.info('Approving consent request', {
        requestId,
        studentId,
        reason: action.reason,
        cid: this.generateCorrelationId(),
      });

      const result = await this.consentService.approveConsent(requestId, studentId, action.reason);

      this.logger.info('Consent request approved successfully', {
        requestId,
        studentId,
        status: result.status,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to approve consent request', { error, requestId });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to approve consent request',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 学生拒绝授权请求
   * POST /consents/:requestId/reject
   */
  @Post(':requestId/reject')
  async rejectConsent(
    @Param('requestId') requestId: string,
    @Body() action: ConsentActionDto,
    @Request() req: any
  ): Promise<ConsentResponseDto> {
    try {
      const studentId = req.user?.id || req.headers['x-student-id'] || 'stu_1';

      this.logger.info('Rejecting consent request', {
        requestId,
        studentId,
        reason: action.reason,
        cid: this.generateCorrelationId(),
      });

      const result = await this.consentService.rejectConsent(requestId, studentId, action.reason);

      this.logger.info('Consent request rejected successfully', {
        requestId,
        studentId,
        status: result.status,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to reject consent request', { error, requestId });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reject consent request',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 学生撤销已同意的授权
   * POST /consents/:requestId/revoke
   */
  @Post(':requestId/revoke')
  async revokeConsent(
    @Param('requestId') requestId: string,
    @Body() action: ConsentActionDto,
    @Request() req: any
  ): Promise<ConsentResponseDto> {
    try {
      const studentId = req.user?.id || req.headers['x-student-id'] || 'stu_1';

      this.logger.info('Revoking consent request', {
        requestId,
        studentId,
        reason: action.reason,
        cid: this.generateCorrelationId(),
      });

      const result = await this.consentService.revokeConsent(requestId, studentId, action.reason);

      this.logger.info('Consent request revoked successfully', {
        requestId,
        studentId,
        status: result.status,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to revoke consent request', { error, requestId });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to revoke consent request',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取授权请求列表
   * GET /consents?status=pending&studentId=stu_1
   */
  @Get()
  async getConsents(
    @Query() query: ConsentListQueryDto,
    @Request() req: any
  ): Promise<ConsentResponseDto[]> {
    try {
      const userId = req.user?.id || req.headers['x-user-id'] || 'stu_1';
      const userRole = req.user?.role || req.headers['x-user-role'] || 'student';

      this.logger.info('Fetching consents list', {
        query,
        userId,
        userRole,
        cid: this.generateCorrelationId(),
      });

      const result = await this.consentService.getConsents(query, userId, userRole);

      this.logger.info('Consents list fetched successfully', {
        count: result.length,
        userId,
        userRole,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch consents list', { error, query });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch consents list',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取单个授权请求详情
   * GET /consents/:requestId
   */
  @Get(':requestId')
  async getConsentById(
    @Param('requestId') requestId: string,
    @Request() req: any
  ): Promise<ConsentResponseDto> {
    try {
      const userId = req.user?.id || req.headers['x-user-id'] || 'stu_1';
      const userRole = req.user?.role || req.headers['x-user-role'] || 'student';

      this.logger.info('Fetching consent details', {
        requestId,
        userId,
        userRole,
        cid: this.generateCorrelationId(),
      });

      const result = await this.consentService.getConsentById(requestId, userId, userRole);

      this.logger.info('Consent details fetched successfully', {
        requestId,
        status: result.status,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch consent details', { error, requestId });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch consent details',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 检查家长访问权限
   * GET /consents/check-access/:parentId/:studentId
   */
  @Get('check-access/:parentId/:studentId')
  async checkParentAccess(
    @Param('parentId') parentId: string,
    @Param('studentId') studentId: string,
    @Request() req: any
  ): Promise<{ hasAccess: boolean; consentId?: string }> {
    try {
      this.logger.info('Checking parent access', {
        parentId,
        studentId,
        cid: this.generateCorrelationId(),
      });

      const hasAccess = await this.consentService.checkParentAccess(parentId, studentId);

      this.logger.info('Parent access check completed', {
        parentId,
        studentId,
        hasAccess,
      });

      return { hasAccess };
    } catch (error) {
      this.logger.error('Failed to check parent access', { error, parentId, studentId });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check parent access',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取学生授权统计
   * GET /consents/stats/:studentId
   */
  @Get('stats/:studentId')
  async getConsentStats(
    @Param('studentId') studentId: string,
    @Request() req: any
  ): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    revoked: number;
  }> {
    try {
      this.logger.info('Fetching consent stats', {
        studentId,
        cid: this.generateCorrelationId(),
      });

      const result = await this.consentService.getConsentStats(studentId);

      this.logger.info('Consent stats fetched successfully', {
        studentId,
        stats: result,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch consent stats', { error, studentId });
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch consent stats',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private generateCorrelationId(): string {
    return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
