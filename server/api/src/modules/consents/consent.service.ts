import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';
import { ConsentActionDto, ConsentResponseDto, ConsentRequestDto, ConsentListQueryDto } from './dto/consent.dto';

export type ConsentStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

interface ConsentRecord {
  id: string;
  studentId: string;
  parentId: string;
  status: ConsentStatus;
  note?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
}

@Injectable()
export class ConsentService {
  private consentsCache: Map<string, ConsentRecord> = new Map();
  private readonly logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger;
    this.initializeMockData();
  }

  /**
   * 初始化模拟数据
   */
  private initializeMockData(): void {
    const mockConsents: ConsentRecord[] = [
      {
        id: 'consent_001',
        studentId: 'stu_1',
        parentId: 'parent_001',
        status: 'pending',
        note: '希望了解孩子的学习进度',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'consent_002',
        studentId: 'stu_2',
        parentId: 'parent_002',
        status: 'approved',
        note: '同意查看学习数据',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        decidedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const consent of mockConsents) {
      this.consentsCache.set(consent.id, consent);
    }
  }

  /**
   * 创建授权请求
   */
  async createConsentRequest(request: ConsentRequestDto): Promise<ConsentResponseDto> {
    const consentId = this.generateConsentId();
    const now = new Date().toISOString();

    const consentRecord: ConsentRecord = {
      id: consentId,
      studentId: request.studentId,
      parentId: request.parentId,
      status: 'pending',
      note: request.note,
      createdAt: now,
      updatedAt: now,
    };

    this.consentsCache.set(consentId, consentRecord);

    this.logger.info('Consent request created', {
      consentId,
      studentId: request.studentId,
      parentId: request.parentId,
      note: request.note,
    });

    return this.mapToResponseDto(consentRecord);
  }

  /**
   * 学生同意授权请求
   */
  async approveConsent(requestId: string, studentId: string, reason?: string): Promise<ConsentResponseDto> {
    const consent = this.consentsCache.get(requestId);
    if (!consent) {
      throw new NotFoundException({
        code: 'CONSENT_NOT_FOUND',
        message: `Consent request with id '${requestId}' not found`,
        cid: this.generateCorrelationId(),
      });
    }

    // 权限检查：只有学生本人可以操作
    if (consent.studentId !== studentId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only the student can approve their own consent requests',
        cid: this.generateCorrelationId(),
      });
    }

    // 状态机检查：只有pending状态才能approve
    if (consent.status !== 'pending') {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: `Cannot approve consent in '${consent.status}' status`,
        cid: this.generateCorrelationId(),
        details: { currentStatus: consent.status },
      });
    }

    // 更新状态
    const now = new Date().toISOString();
    consent.status = 'approved';
    consent.reason = reason;
    consent.updatedAt = now;
    consent.decidedAt = now;

    this.consentsCache.set(requestId, consent);

    this.logger.info('Consent approved', {
      consentId: requestId,
      studentId,
      reason,
    });

    return this.mapToResponseDto(consent);
  }

  /**
   * 学生拒绝授权请求
   */
  async rejectConsent(requestId: string, studentId: string, reason?: string): Promise<ConsentResponseDto> {
    const consent = this.consentsCache.get(requestId);
    if (!consent) {
      throw new NotFoundException({
        code: 'CONSENT_NOT_FOUND',
        message: `Consent request with id '${requestId}' not found`,
        cid: this.generateCorrelationId(),
      });
    }

    // 权限检查
    if (consent.studentId !== studentId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only the student can reject their own consent requests',
        cid: this.generateCorrelationId(),
      });
    }

    // 状态机检查
    if (consent.status !== 'pending') {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: `Cannot reject consent in '${consent.status}' status`,
        cid: this.generateCorrelationId(),
        details: { currentStatus: consent.status },
      });
    }

    // 更新状态
    const now = new Date().toISOString();
    consent.status = 'rejected';
    consent.reason = reason;
    consent.updatedAt = now;
    consent.decidedAt = now;

    this.consentsCache.set(requestId, consent);

    this.logger.info('Consent rejected', {
      consentId: requestId,
      studentId,
      reason,
    });

    return this.mapToResponseDto(consent);
  }

  /**
   * 学生撤销已同意的授权
   */
  async revokeConsent(requestId: string, studentId: string, reason?: string): Promise<ConsentResponseDto> {
    const consent = this.consentsCache.get(requestId);
    if (!consent) {
      throw new NotFoundException({
        code: 'CONSENT_NOT_FOUND',
        message: `Consent request with id '${requestId}' not found`,
        cid: this.generateCorrelationId(),
      });
    }

    // 权限检查
    if (consent.studentId !== studentId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only the student can revoke their own consent requests',
        cid: this.generateCorrelationId(),
      });
    }

    // 状态机检查：只有approved状态才能revoke
    if (consent.status !== 'approved') {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: `Cannot revoke consent in '${consent.status}' status`,
        cid: this.generateCorrelationId(),
        details: { currentStatus: consent.status },
      });
    }

    // 更新状态
    const now = new Date().toISOString();
    consent.status = 'revoked';
    consent.reason = reason;
    consent.updatedAt = now;
    consent.decidedAt = now;

    this.consentsCache.set(requestId, consent);

    this.logger.info('Consent revoked', {
      consentId: requestId,
      studentId,
      reason,
    });

    return this.mapToResponseDto(consent);
  }

  /**
   * 获取授权请求列表
   */
  async getConsents(query: ConsentListQueryDto, userId: string, userRole: string): Promise<ConsentResponseDto[]> {
    let consents = Array.from(this.consentsCache.values());

    // 权限过滤
    if (userRole === 'student') {
      consents = consents.filter(c => c.studentId === userId);
    } else if (userRole === 'parent') {
      consents = consents.filter(c => c.parentId === userId);
    }
    // admin角色可以看到所有

    // 状态过滤
    if (query.status) {
      consents = consents.filter(c => c.status === query.status);
    }

    // 学生ID过滤
    if (query.studentId) {
      consents = consents.filter(c => c.studentId === query.studentId);
    }

    // 家长ID过滤
    if (query.parentId) {
      consents = consents.filter(c => c.parentId === query.parentId);
    }

    // 按创建时间倒序排列
    consents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return consents.map(consent => this.mapToResponseDto(consent));
  }

  /**
   * 获取单个授权请求详情
   */
  async getConsentById(requestId: string, userId: string, userRole: string): Promise<ConsentResponseDto> {
    const consent = this.consentsCache.get(requestId);
    if (!consent) {
      throw new NotFoundException({
        code: 'CONSENT_NOT_FOUND',
        message: `Consent request with id '${requestId}' not found`,
        cid: this.generateCorrelationId(),
      });
    }

    // 权限检查
    if (userRole === 'student' && consent.studentId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Access denied to this consent request',
        cid: this.generateCorrelationId(),
      });
    }

    if (userRole === 'parent' && consent.parentId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Access denied to this consent request',
        cid: this.generateCorrelationId(),
      });
    }

    return this.mapToResponseDto(consent);
  }

  /**
   * 检查家长是否有权限访问学生数据
   */
  async checkParentAccess(parentId: string, studentId: string): Promise<boolean> {
    const consents = Array.from(this.consentsCache.values());
    const validConsent = consents.find(c => 
      c.parentId === parentId && 
      c.studentId === studentId && 
      c.status === 'approved'
    );

    return !!validConsent;
  }

  /**
   * 获取学生的授权状态统计
   */
  async getConsentStats(studentId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    revoked: number;
  }> {
    const consents = Array.from(this.consentsCache.values())
      .filter(c => c.studentId === studentId);

    const stats = {
      total: consents.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      revoked: 0,
    };

    for (const consent of consents) {
      stats[consent.status]++;
    }

    return stats;
  }

  /**
   * 映射到响应DTO
   */
  private mapToResponseDto(consent: ConsentRecord): ConsentResponseDto {
    return {
      id: consent.id,
      status: consent.status,
      decidedAt: consent.decidedAt || consent.updatedAt,
      reason: consent.reason,
      studentId: consent.studentId,
      parentId: consent.parentId,
      createdAt: consent.createdAt,
      updatedAt: consent.updatedAt,
    };
  }

  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
