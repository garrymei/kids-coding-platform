import { 
  Controller, 
  Get, 
  Post,
  Body, 
  Param, 
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions, Permission } from '../../auth/decorators/permissions.decorator';
import { VisibilityService } from '../../auth/services/visibility.service';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('parent-permissions')
@Controller('parents/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ParentPermissionsController {
  constructor(
    private readonly visibilityService: VisibilityService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('authorized-students')
  @RequirePermissions(Permission.VIEW_AUTHORIZED_STUDENT_DATA)
  @ApiOperation({ summary: '获取已授权的学生列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAuthorizedStudents(@Request() req) {
    const parentId = req.user.userId;

    const relationships = await this.prisma.relationship.findMany({
      where: {
        partyId: parentId,
        partyRole: 'PARENT',
        status: 'ACTIVE',
      },
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
        accessGrants: {
          where: { status: 'ACTIVE' },
          select: {
            scope: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
    });

    return relationships.map(rel => ({
      student: rel.student,
      accessInfo: {
        scopes: rel.accessGrants[0]?.scope || [],
        expiresAt: rel.accessGrants[0]?.expiresAt,
        grantedAt: rel.accessGrants[0]?.createdAt,
      },
      relationshipId: rel.id,
    }));
  }

  @Get('student-data/:studentId')
  @RequirePermissions(Permission.VIEW_AUTHORIZED_STUDENT_DATA)
  @ApiOperation({ summary: '查看授权学生的数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentData(@Request() req, @Param('studentId') studentId: string) {
    const parentId = req.user.userId;

    // 检查是否有访问权限
    const hasAccess = await this.visibilityService.hasDataAccess(parentId, studentId, 'progress:read');
    if (!hasAccess) {
      throw new Error('无权限访问该学生数据');
    }

    // 获取过滤后的学生数据
    const studentData = await this.visibilityService.filterStudentData(studentId, parentId, 'parent');
    
    if (!studentData) {
      throw new Error('学生数据不存在或无访问权限');
    }

    // 记录访问日志
    await this.prisma.auditLog.create({
      data: {
        actorId: parentId,
        action: 'view_student_data',
        targetType: 'student',
        targetId: studentId,
        metadata: {
          viewerRole: 'parent',
          dataTypes: studentData.accessInfo?.scopes || [],
        },
      },
    });

    return studentData;
  }

  @Get('student-progress/:studentId')
  @RequirePermissions(Permission.VIEW_AUTHORIZED_STUDENT_DATA)
  @ApiOperation({ summary: '查看学生学习进度' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentProgress(@Request() req, @Param('studentId') studentId: string) {
    const parentId = req.user.userId;

    // 检查是否有进度查看权限
    const hasAccess = await this.visibilityService.hasDataAccess(parentId, studentId, 'progress:read');
    if (!hasAccess) {
      throw new Error('无权限查看该学生学习进度');
    }

    // 获取学习进度数据
    const progressData = await this.prisma.metricsSnapshot.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 30, // 最近30天的数据
    });

    // 记录访问日志
    await this.prisma.auditLog.create({
      data: {
        actorId: parentId,
        action: 'view_student_progress',
        targetType: 'student',
        targetId: studentId,
        metadata: {
          dataRange: '30_days',
          recordCount: progressData.length,
        },
      },
    });

    return {
      studentId,
      progressData: progressData.map(snapshot => ({
        date: snapshot.date,
        tasksDone: snapshot.tasksDone,
        accuracy: snapshot.accuracy,
        timeSpentMin: snapshot.timeSpentMin,
        streakDays: snapshot.streakDays,
        xpGained: snapshot.xpGained,
        // 不包含具体的任务详情
      })),
      summary: {
        totalTasks: progressData.reduce((sum, s) => sum + s.tasksDone, 0),
        totalTime: progressData.reduce((sum, s) => sum + s.timeSpentMin, 0),
        totalXP: progressData.reduce((sum, s) => sum + s.xpGained, 0),
        averageAccuracy: progressData.length > 0 
          ? progressData.reduce((sum, s) => sum + s.accuracy, 0) / progressData.length 
          : 0,
        currentStreak: progressData.length > 0 ? progressData[0].streakDays : 0,
      },
    };
  }

  @Get('student-works/:studentId')
  @RequirePermissions(Permission.VIEW_AUTHORIZED_STUDENT_DATA)
  @ApiOperation({ summary: '查看学生作品（不含代码）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentWorks(@Request() req, @Param('studentId') studentId: string) {
    const parentId = req.user.userId;

    // 检查是否有作品查看权限
    const hasAccess = await this.visibilityService.hasDataAccess(parentId, studentId, 'works:read');
    if (!hasAccess) {
      throw new Error('无权限查看该学生作品');
    }

    // 这里应该查询学生的作品数据
    // 家长只能看到成果，不能看到代码内容
    const works = []; // 实际实现中应该从数据库查询

    // 记录访问日志
    await this.prisma.auditLog.create({
      data: {
        actorId: parentId,
        action: 'view_student_works',
        targetType: 'student',
        targetId: studentId,
        metadata: {
          viewerRole: 'parent',
          note: '家长只能查看学习成果，不能查看代码内容',
        },
      },
    });

    return {
      studentId,
      works: works.map(work => ({
        id: work.id,
        title: work.title,
        description: work.description,
        createdAt: work.createdAt,
        // 不包含代码内容
        note: '家长只能查看学习成果，不能查看代码内容',
      })),
    };
  }

  @Post('request-access')
  @RequirePermissions(Permission.REQUEST_STUDENT_ACCESS)
  @ApiOperation({ summary: '申请访问学生数据' })
  @ApiResponse({ status: 201, description: '申请创建成功' })
  async requestAccess(@Request() req, @Body() requestData: any) {
    const parentId = req.user.userId;
    const { studentId, purpose, reason, scopes, expiresAt } = requestData;

    // 检查是否已存在关系
    const existingRelationship = await this.prisma.relationship.findFirst({
      where: {
        studentId,
        partyId: parentId,
        partyRole: 'PARENT',
      },
    });

    if (existingRelationship && existingRelationship.status === 'ACTIVE') {
      throw new Error('您已经关注了该学生');
    }

    // 创建关注申请
    const consent = await this.prisma.consent.create({
      data: {
        studentId,
        requesterId: parentId,
        purpose,
        scope: scopes || ['progress:read', 'works:read'],
        reason,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: 'PENDING',
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: parentId,
        action: 'request_student_access',
        targetType: 'consent',
        targetId: consent.id,
        metadata: {
          studentId,
          purpose,
          scopes: scopes || ['progress:read', 'works:read'],
        },
      },
    });

    return {
      message: '关注申请已发送，等待学生同意',
      consentId: consent.id,
    };
  }

  @Get('access-status/:studentId')
  @RequirePermissions(Permission.VIEW_AUTHORIZED_STUDENT_DATA)
  @ApiOperation({ summary: '查看对特定学生的访问状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAccessStatus(@Request() req, @Param('studentId') studentId: string) {
    const parentId = req.user.userId;

    const relationship = await this.prisma.relationship.findFirst({
      where: {
        studentId,
        partyId: parentId,
        partyRole: 'PARENT',
      },
      include: {
        accessGrants: {
          where: { status: 'ACTIVE' },
          select: {
            scope: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!relationship) {
      return {
        hasAccess: false,
        status: 'no_relationship',
        message: '尚未建立关注关系',
      };
    }

    return {
      hasAccess: relationship.status === 'ACTIVE',
      status: relationship.status,
      scopes: relationship.accessGrants[0]?.scope || [],
      expiresAt: relationship.accessGrants[0]?.expiresAt,
      grantedAt: relationship.accessGrants[0]?.createdAt,
      relationshipId: relationship.id,
    };
  }
}
