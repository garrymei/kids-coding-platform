import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
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
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('class-invite')
@Controller('classes/invite')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ClassInviteController {
  constructor(
    private readonly classManagementService: ClassManagementService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('code/:code')
  @ApiOperation({ summary: '通过邀请码获取班级信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getClassByCode(@Param('code') code: string) {
    const classInfo = await this.prisma.class.findUnique({
      where: { code },
      include: {
        ownerTeacher: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!classInfo) {
      throw new Error('邀请码无效');
    }

    if (classInfo.status !== 'ACTIVE') {
      throw new Error('班级已关闭');
    }

    return {
      id: classInfo.id,
      name: classInfo.name,
      description: classInfo.description,
      code: classInfo.code,
      teacher: classInfo.ownerTeacher,
      studentCount: classInfo._count.enrollments,
      status: classInfo.status,
      createdAt: classInfo.createdAt,
    };
  }

  @Post('join/:code')
  @RequirePermissions(Permission.VIEW_OWN_AUDIT) // 学生权限
  @ApiOperation({ summary: '通过邀请码加入班级' })
  @ApiResponse({ status: 201, description: '入班申请已提交' })
  async joinClassByCode(@Request() req, @Param('code') code: string) {
    const studentId = req.user.userId;
    return this.classManagementService.joinClass(studentId, code);
  }

  @Get('my-invites')
  @RequirePermissions(Permission.MANAGE_CLASS)
  @ApiOperation({ summary: '获取我的班级邀请码' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyInvites(@Request() req) {
    const teacherId = req.user.userId;

    const classes = await this.prisma.class.findMany({
      where: {
        ownerTeacherId: teacherId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      code: cls.code,
      description: cls.description,
      studentCount: cls._count.enrollments,
      inviteUrl: `/classes/join/${cls.code}`,
      qrCodeUrl: `/api/classes/invite/qr/${cls.code}`,
      createdAt: cls.createdAt,
    }));
  }

  @Post(':classId/regenerate-code')
  @RequirePermissions(Permission.MANAGE_CLASS)
  @ApiOperation({ summary: '重新生成班级邀请码' })
  @ApiResponse({ status: 200, description: '邀请码已重新生成' })
  async regenerateInviteCode(
    @Request() req,
    @Param('classId') classId: string,
  ) {
    const teacherId = req.user.userId;

    // 验证教师是否拥有该班级
    const classInfo = await this.prisma.class.findFirst({
      where: {
        id: classId,
        ownerTeacherId: teacherId,
        status: 'ACTIVE',
      },
    });

    if (!classInfo) {
      throw new Error('班级不存在或您没有权限访问');
    }

    // 生成新的邀请码
    const newCode = this.generateInviteCode();

    // 更新班级邀请码
    const updatedClass = await this.prisma.class.update({
      where: { id: classId },
      data: { code: newCode },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: teacherId,
        action: 'regenerate_class_invite_code',
        targetType: 'class',
        targetId: classId,
        metadata: {
          oldCode: classInfo.code,
          newCode: newCode,
          className: classInfo.name,
        },
      },
    });

    return {
      message: '邀请码已重新生成',
      classId,
      newCode,
      inviteUrl: `/classes/join/${newCode}`,
      qrCodeUrl: `/api/classes/invite/qr/${newCode}`,
    };
  }

  @Get('qr/:code')
  @ApiOperation({ summary: '生成班级邀请码二维码' })
  @ApiResponse({ status: 200, description: '二维码生成成功' })
  async generateQRCode(@Param('code') code: string) {
    // 验证邀请码有效性
    const classInfo = await this.prisma.class.findUnique({
      where: { code },
      select: { id: true, name: true, status: true },
    });

    if (!classInfo || classInfo.status !== 'ACTIVE') {
      throw new Error('邀请码无效或班级已关闭');
    }

    // 这里应该生成二维码图片
    // 暂时返回二维码URL
    return {
      qrCodeUrl: `/api/classes/invite/qr/${code}`,
      inviteUrl: `/classes/join/${code}`,
      className: classInfo.name,
      code,
    };
  }

  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
