import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Body, 
  Param, 
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions, Permission } from '../../auth/decorators/permissions.decorator';
import { RateLimitService } from '../../search/services/rate-limit.service';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('relationship-requests')
@Controller('relationships')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RequestsController {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('requests')
  @RequirePermissions(Permission.REQUEST_STUDENT_ACCESS)
  @ApiOperation({ summary: '发起关注申请' })
  @ApiResponse({ status: 201, description: '申请创建成功' })
  async createRequest(@Request() req, @Body() requestData: {
    studentId?: string;
    shareCode?: string;
    scope: string[];
    reason: string;
    expiresAt?: string;
  }) {
    const requesterId = req.user.userId;
    const requesterIp = req.ip || req.connection.remoteAddress;

    // 检查速率限制
    await this.rateLimitService.checkRequestRateLimit(requesterId, 'user');
    if (requesterIp) {
      await this.rateLimitService.checkRequestRateLimit(requesterIp, 'ip');
    }

    // 验证请求数据
    if (!requestData.studentId && !requestData.shareCode) {
      throw new BadRequestException('必须提供学生ID或分享码');
    }

    if (!requestData.scope || requestData.scope.length === 0) {
      throw new BadRequestException('必须指定访问范围');
    }

    if (!requestData.reason || requestData.reason.trim().length < 10) {
      throw new BadRequestException('申请理由至少需要10个字符');
    }

    // 查找目标学生
    let targetStudent;
    if (requestData.studentId) {
      targetStudent = await this.prisma.user.findUnique({
        where: { id: requestData.studentId },
        include: { role: true },
      });
    } else if (requestData.shareCode) {
      // 这里应该通过分享码查找学生
      // 暂时用模拟数据
      targetStudent = {
        id: 'temp-student-id',
        role: { name: 'student' },
      };
    }

    if (!targetStudent || targetStudent.role.name !== 'student') {
      throw new NotFoundException('目标学生不存在');
    }

    // 检查是否已存在关系
    const existingRelationship = await this.prisma.relationship.findFirst({
      where: {
        studentId: targetStudent.id,
        partyId: requesterId,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
    });

    if (existingRelationship) {
      throw new BadRequestException('您已经关注了该学生或申请正在处理中');
    }

    // 创建关注申请
    const consent = await this.prisma.consent.create({
      data: {
        studentId: targetStudent.id,
        requesterId,
        purpose: 'relationship_request',
        scope: requestData.scope,
        reason: requestData.reason,
        expiresAt: requestData.expiresAt ? new Date(requestData.expiresAt) : null,
        status: 'PENDING',
      },
    });

    // 创建关系记录（待处理状态）
    const relationship = await this.prisma.relationship.create({
      data: {
        studentId: targetStudent.id,
        partyId: requesterId,
        partyRole: 'PARENT', // 这里需要根据实际情况判断
        source: requestData.shareCode ? 'SHARE_CODE' : 'SEARCH',
        status: 'PENDING',
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: requesterId,
        action: 'create_relationship_request',
        targetType: 'consent',
        targetId: consent.id,
        metadata: {
          studentId: targetStudent.id,
          scope: requestData.scope,
          reason: requestData.reason,
          expiresAt: requestData.expiresAt,
          shareCode: requestData.shareCode,
          ip: requesterIp,
        },
      },
    });

    // 这里应该发送通知给学生
    // await this.notificationService.sendRequestNotification(targetStudent.id, consent.id);

    return {
      message: '关注申请已发送，等待学生同意',
      consentId: consent.id,
      relationshipId: relationship.id,
      studentId: targetStudent.id,
    };
  }

  @Get('pending-requests')
  @RequirePermissions(Permission.APPROVE_RELATIONSHIPS)
  @ApiOperation({ summary: '获取待处理的关注请求' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPendingRequests(@Request() req) {
    const studentId = req.user.userId;

    const pendingRequests = await this.prisma.consent.findMany({
      where: {
        studentId,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pendingRequests.map(request => ({
      id: request.id,
      requester: request.requester,
      purpose: request.purpose,
      scope: request.scope,
      reason: request.reason,
      expiresAt: request.expiresAt,
      createdAt: request.createdAt,
    }));
  }

  @Post('requests/:consentId/approve')
  @RequirePermissions(Permission.APPROVE_RELATIONSHIPS)
  @ApiOperation({ summary: '批准关注请求' })
  @ApiResponse({ status: 200, description: '批准成功' })
  async approveRequest(
    @Request() req,
    @Param('consentId') consentId: string,
    @Body() approvalData: {
      scopes?: string[];
      expiresAt?: string;
    }
  ) {
    const studentId = req.user.userId;

    // 查找待处理的请求
    const consent = await this.prisma.consent.findFirst({
      where: {
        id: consentId,
        studentId,
        status: 'PENDING',
      },
    });

    if (!consent) {
      throw new NotFoundException('请求不存在或已处理');
    }

    // 更新同意书状态
    await this.prisma.consent.update({
      where: { id: consentId },
      data: {
        status: 'APPROVED',
        scope: approvalData.scopes || consent.scope,
        expiresAt: approvalData.expiresAt ? new Date(approvalData.expiresAt) : consent.expiresAt,
      },
    });

    // 更新关系状态
    const relationship = await this.prisma.relationship.findFirst({
      where: {
        studentId,
        partyId: consent.requesterId,
        status: 'PENDING',
      },
    });

    if (relationship) {
      await this.prisma.relationship.update({
        where: { id: relationship.id },
        data: { status: 'ACTIVE' },
      });
    }

    // 创建访问授权
    const accessGrant = await this.prisma.accessGrant.create({
      data: {
        granteeId: consent.requesterId,
        studentId,
        scope: approvalData.scopes || consent.scope,
        status: 'ACTIVE',
        expiresAt: approvalData.expiresAt ? new Date(approvalData.expiresAt) : consent.expiresAt,
        relationshipId: relationship?.id,
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'approve_relationship_request',
        targetType: 'consent',
        targetId: consentId,
        metadata: {
          requesterId: consent.requesterId,
          scopes: approvalData.scopes || consent.scope,
          expiresAt: approvalData.expiresAt,
          accessGrantId: accessGrant.id,
        },
      },
    });

    return {
      message: '关注请求已批准',
      consentId,
      relationshipId: relationship?.id,
      accessGrantId: accessGrant.id,
    };
  }

  @Post('requests/:consentId/reject')
  @RequirePermissions(Permission.APPROVE_RELATIONSHIPS)
  @ApiOperation({ summary: '拒绝关注请求' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  async rejectRequest(
    @Request() req,
    @Param('consentId') consentId: string,
    @Body() rejectionData: { reason?: string }
  ) {
    const studentId = req.user.userId;

    const consent = await this.prisma.consent.findFirst({
      where: {
        id: consentId,
        studentId,
        status: 'PENDING',
      },
    });

    if (!consent) {
      throw new NotFoundException('请求不存在或已处理');
    }

    // 更新同意书状态
    await this.prisma.consent.update({
      where: { id: consentId },
      data: { 
        status: 'REJECTED',
        reason: rejectionData.reason ? `${consent.reason} [拒绝理由: ${rejectionData.reason}]` : consent.reason,
      },
    });

    // 更新关系状态
    const relationship = await this.prisma.relationship.findFirst({
      where: {
        studentId,
        partyId: consent.requesterId,
        status: 'PENDING',
      },
    });

    if (relationship) {
      await this.prisma.relationship.update({
        where: { id: relationship.id },
        data: { status: 'REVOKED' },
      });
    }

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'reject_relationship_request',
        targetType: 'consent',
        targetId: consentId,
        metadata: {
          requesterId: consent.requesterId,
          rejectionReason: rejectionData.reason,
        },
      },
    });

    return {
      message: '关注请求已拒绝',
      consentId,
      relationshipId: relationship?.id,
    };
  }

  @Get('my-requests')
  @RequirePermissions(Permission.REQUEST_STUDENT_ACCESS)
  @ApiOperation({ summary: '获取我发起的申请' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyRequests(@Request() req) {
    const requesterId = req.user.userId;

    const requests = await this.prisma.consent.findMany({
      where: { requesterId },
      include: {
        student: {
          select: {
            id: true,
            displayName: true,
            nickname: true,
            school: true,
            className: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map(request => ({
      id: request.id,
      student: request.student,
      purpose: request.purpose,
      scope: request.scope,
      reason: request.reason,
      status: request.status,
      expiresAt: request.expiresAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));
  }
}
