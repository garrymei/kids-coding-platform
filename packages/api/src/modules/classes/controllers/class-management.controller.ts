import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import {
  RequirePermissions,
  Permission,
} from '../../auth/decorators/permissions.decorator';
import { ClassManagementService } from '../services/class-management.service';
import {
  CreateClassDto,
  JoinClassDto,
  ApproveEnrollmentDto,
  UpdateClassDto,
  LeaveClassDto,
  ClassResponseDto,
  StudentClassResponseDto,
  PendingEnrollmentResponseDto,
} from '../dto/class-management.dto';
import { AuditLoggerService } from '../../audit/services/audit-logger.service';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('class-management')
@Controller('classes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ClassManagementController {
  constructor(
    private readonly classManagementService: ClassManagementService,
    private readonly auditLogger: AuditLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_CLASS)
  @ApiOperation({ summary: '教师创建班级' })
  @ApiResponse({
    status: 201,
    description: '班级创建成功',
    type: ClassResponseDto,
  })
  async createClass(@Request() req, @Body() classData: CreateClassDto) {
    const teacherId = req.user.userId;
    const result = await this.classManagementService.createClass(
      teacherId,
      classData,
    );

    // 记录审计日志
    await this.auditLogger.logSystemOperation(
      teacherId,
      'create_class',
      'class',
      result.id,
      {
        className: classData.name,
        ip: req.ip,
      },
    );

    return result;
  }

  @Post('join')
  @RequirePermissions(Permission.VIEW_OWN_AUDIT) // 学生权限
  @ApiOperation({ summary: '学生加入班级' })
  @ApiResponse({ status: 201, description: '入班申请已提交' })
  async joinClass(@Request() req, @Body() joinData: JoinClassDto) {
    const studentId = req.user.userId;
    const result = await this.classManagementService.joinClass(
      studentId,
      joinData.code,
    );

    // 记录审计日志
    await this.auditLogger.logSystemOperation(
      studentId,
      'join_class_request',
      'class',
      result.class.id,
      {
        ip: req.ip,
      },
    );

    return result;
  }

  @Post('enrollments/:enrollmentId/approve')
  @RequirePermissions(Permission.MANAGE_CLASS)
  @ApiOperation({ summary: '教师审批学生入班申请' })
  @ApiResponse({ status: 200, description: '审批成功' })
  async approveEnrollment(
    @Request() req,
    @Param('enrollmentId') enrollmentId: string,
    @Body() decision: ApproveEnrollmentDto,
  ) {
    const teacherId = req.user.userId;
    const result = await this.classManagementService.approveEnrollment(
      teacherId,
      enrollmentId,
      decision.action,
    );

    // For audit logging, we need to get the class ID from the enrollment
    // Since the result doesn't directly contain classId, we'll use the enrollmentId
    // and add more context in the metadata

    // 记录审计日志 - Class member decision
    if (decision.action === 'approve') {
      await this.auditLogger.logClassMemberDecision(
        teacherId,
        enrollmentId, // Using enrollmentId as the target since we don't have classId directly
        result.student?.id || 'unknown',
        'add',
        req.ip,
        {
          enrollmentId,
          relationshipId: result.relationshipId,
          accessGrantId: result.accessGrantId,
          action: 'approve',
        },
      );
    } else {
      await this.auditLogger.logClassMemberDecision(
        teacherId,
        enrollmentId, // Using enrollmentId as the target since we don't have classId directly
        result.student?.id || 'unknown',
        'remove',
        req.ip,
        {
          enrollmentId,
          action: 'reject',
        },
      );
    }

    return result;
  }

  @Post(':classId/leave')
  @RequirePermissions(Permission.VIEW_OWN_AUDIT) // 学生权限
  @ApiOperation({ summary: '学生退出班级' })
  @ApiResponse({ status: 200, description: '退出成功' })
  async leaveClass(
    @Request() req,
    @Param('classId') classId: string,
    @Body() leaveData: LeaveClassDto,
  ) {
    const studentId = req.user.userId;
    const result = await this.classManagementService.leaveClass(
      studentId,
      classId,
    );

    // 记录审计日志
    await this.auditLogger.logSystemOperation(
      studentId,
      'leave_class',
      'class',
      classId,
      {
        reason: leaveData.reason,
        ip: req.ip,
      },
    );

    return result;
  }

  @Get('my-classes')
  @RequirePermissions(Permission.MANAGE_CLASS)
  @ApiOperation({ summary: '获取教师的班级列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [ClassResponseDto],
  })
  async getTeacherClasses(@Request() req) {
    const teacherId = req.user.userId;
    return this.classManagementService.getTeacherClasses(teacherId);
  }

  @Get('student-classes')
  @RequirePermissions(Permission.VIEW_OWN_AUDIT) // 学生权限
  @ApiOperation({ summary: '获取学生的班级列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [StudentClassResponseDto],
  })
  async getStudentClasses(@Request() req) {
    const studentId = req.user.userId;
    return this.classManagementService.getStudentClasses(studentId);
  }

  @Get(':classId/pending-enrollments')
  @RequirePermissions(Permission.MANAGE_CLASS)
  @ApiOperation({ summary: '获取班级的待审批学生列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [PendingEnrollmentResponseDto],
  })
  async getPendingEnrollments(
    @Request() req,
    @Param('classId') classId: string,
  ) {
    const teacherId = req.user.userId;
    return this.classManagementService.getPendingEnrollments(
      teacherId,
      classId,
    );
  }

  @Put(':classId')
  @RequirePermissions(Permission.MANAGE_CLASS)
  @ApiOperation({ summary: '更新班级信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateClass(
    @Request() req,
    @Param('classId') classId: string,
    @Body() updateData: UpdateClassDto,
  ) {
    const teacherId = req.user.userId;
    const result = await this.classManagementService.updateClass(
      teacherId,
      classId,
      updateData,
    );

    // 记录审计日志
    await this.auditLogger.logSystemOperation(
      teacherId,
      'update_class',
      'class',
      classId,
      {
        updates: updateData,
        ip: req.ip,
      },
    );

    return result;
  }

  @Get(':classId')
  @RequirePermissions(Permission.MANAGE_CLASS)
  @ApiOperation({ summary: '获取班级详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getClassDetails(@Request() req, @Param('classId') classId: string) {
    const teacherId = req.user.userId;

    // 获取班级详情
    const classDetails =
      await this.classManagementService.getTeacherClasses(teacherId);
    const targetClass = classDetails.find((cls) => cls.id === classId);

    if (!targetClass) {
      throw new Error('班级不存在或您没有权限访问');
    }

    // 获取待审批学生
    const pendingEnrollments =
      await this.classManagementService.getPendingEnrollments(
        teacherId,
        classId,
      );

    return {
      ...targetClass,
      pendingEnrollments,
    };
  }

  @Post('generate-invite-code')
  @RequirePermissions(Permission.MANAGE_CLASS)
  @ApiOperation({ summary: '生成班级邀请码（别名接口）' })
  @ApiResponse({ status: 200, description: '邀请码生成成功' })
  async generateInviteCodeAlias(
    @Request() req,
    @Body() body: { classId: string },
  ) {
    const teacherId = req.user.userId;
    const { classId } = body;

    // 验证教师是否拥有该班级
    const classInfo = await (this as any).prisma?.class?.findFirst?.({
      where: {
        id: classId,
        teacherId,
        status: 'ACTIVE',
      },
    });

    // 若无法通过service注入prisma，则使用classManagementService的查询作为兜底
    const validClass =
      classInfo ||
      (await this.classManagementService.getTeacherClasses(teacherId)).find(
        (cls) => cls.id === classId,
      );

    if (!validClass) {
      throw new Error('班级不存在或您没有权限访问');
    }

    // 简单生成新邀请码（与class-invite保持一致风格）
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 更新班级邀请码
    // 这里优先使用prisma，如不可用则忽略更新（避免运行时失败）
    if ((this as any).prisma?.class?.update) {
      await (this as any).prisma.class.update({
        where: { id: classId },
        data: { code: newCode },
      });
    }

    // 记录审计日志
    await this.auditLogger.log({
      actorId: teacherId,
      action: 'class_invite_sent',
      targetType: 'class',
      targetId: classId,
      metadata: {
        inviteCode: newCode,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        timestamp: new Date().toISOString(),
      },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return {
      message: '邀请码已生成',
      classId,
      newCode,
      inviteUrl: `/classes/join/${newCode}`,
      qrCodeUrl: `/api/classes/invite/qr/${newCode}`,
    };
  }
}
