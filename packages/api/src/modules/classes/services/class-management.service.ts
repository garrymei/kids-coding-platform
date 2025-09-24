import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ClassManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // 生成班级邀请码
  private generateInviteCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  // 教师创建班级
  async createClass(
    teacherId: string,
    classData: {
      name: string;
      description?: string;
    },
  ) {
    // 验证教师身份
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: { role: true },
    });

    if (!teacher || teacher.role.name !== 'teacher') {
      throw new ForbiddenException('只有教师可以创建班级');
    }

    // 生成唯一的邀请码
    let inviteCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      inviteCode = this.generateInviteCode();
      const existingClass = await this.prisma.class.findUnique({
        where: { code: inviteCode },
      });
      isUnique = !existingClass;
      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException('无法生成唯一的邀请码，请重试');
    }

    // 创建班级
    const newClass = await this.prisma.class.create({
      data: {
        name: classData.name,
        description: classData.description,
        ownerTeacherId: teacherId,
        code: inviteCode!,
        status: 'ACTIVE',
      },
      include: {
        ownerTeacher: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: teacherId,
        action: 'create_class',
        targetType: 'class',
        targetId: newClass.id,
        metadata: {
          className: classData.name,
          inviteCode: inviteCode,
          description: classData.description,
        },
      },
    });

    return {
      id: newClass.id,
      name: newClass.name,
      description: newClass.description,
      code: newClass.code,
      status: newClass.status,
      ownerTeacher: newClass.ownerTeacher,
      createdAt: newClass.createdAt,
      inviteUrl: `/classes/join/${newClass.code}`, // 邀请链接
    };
  }

  // 学生加入班级
  async joinClass(studentId: string, inviteCode: string) {
    // 验证学生身份
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { role: true },
    });

    if (!student || student.role.name !== 'student') {
      throw new ForbiddenException('只有学生可以加入班级');
    }

    // 查找班级
    const targetClass = await this.prisma.class.findUnique({
      where: { code: inviteCode },
      include: {
        ownerTeacher: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!targetClass) {
      throw new NotFoundException('邀请码无效');
    }

    if (targetClass.status !== 'ACTIVE') {
      throw new BadRequestException('班级已关闭，无法加入');
    }

    // 检查是否已经加入过该班级
    const existingEnrollment = await this.prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: targetClass.id,
          studentId: studentId,
        },
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'ACTIVE') {
        throw new BadRequestException('您已经在该班级中');
      } else if (existingEnrollment.status === 'PENDING') {
        throw new BadRequestException('您的入班申请正在审核中');
      } else if (existingEnrollment.status === 'REVOKED') {
        throw new BadRequestException('您已被移出该班级，无法重新加入');
      }
    }

    // 创建入班申请
    const enrollment = await this.prisma.classEnrollment.create({
      data: {
        classId: targetClass.id,
        studentId: studentId,
        status: 'PENDING',
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'join_class_request',
        targetType: 'class',
        targetId: targetClass.id,
        metadata: {
          className: targetClass.name,
          inviteCode: inviteCode,
          teacherId: targetClass.ownerTeacherId,
        },
      },
    });

    return {
      message: '入班申请已提交，等待教师审核',
      enrollmentId: enrollment.id,
      class: {
        id: targetClass.id,
        name: targetClass.name,
        description: targetClass.description,
        teacher: targetClass.ownerTeacher,
      },
      status: 'PENDING',
    };
  }

  // 教师审批学生入班
  async approveEnrollment(
    teacherId: string,
    enrollmentId: string,
    decision: 'approve' | 'reject',
  ) {
    // 验证教师身份
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: { role: true },
    });

    if (!teacher || teacher.role.name !== 'teacher') {
      throw new ForbiddenException('只有教师可以审批入班申请');
    }

    // 查找入班申请
    const enrollment = await this.prisma.classEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        class: {
          include: {
            ownerTeacher: {
              select: { id: true },
            },
          },
        },
        student: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('入班申请不存在');
    }

    // 验证教师是否拥有该班级
    if (enrollment.class.ownerTeacher.id !== teacherId) {
      throw new ForbiddenException('您没有权限审批该班级的入班申请');
    }

    if (enrollment.status !== 'PENDING') {
      throw new BadRequestException('该申请已经处理过了');
    }

    // 更新入班状态
    await this.prisma.classEnrollment.update({
      where: { id: enrollmentId },
      data: { status: decision === 'approve' ? 'ACTIVE' : 'REVOKED' },
    });

    if (decision === 'approve') {
      // 创建关系记录
      const relationship = await this.prisma.relationship.create({
        data: {
          studentId: enrollment.studentId,
          partyId: teacherId,
          partyRole: 'TEACHER',
          source: 'CLASS_INVITE',
          status: 'ACTIVE',
        },
      });

      // 自动创建访问授权
      const accessGrant = await this.prisma.accessGrant.create({
        data: {
          granteeId: teacherId,
          studentId: enrollment.studentId,
          scope: ['progress:read', 'metrics:read', 'works:read'],
          status: 'ACTIVE',
          relationshipId: relationship.id,
        },
      });

      // 记录审计日志
      await this.prisma.auditLog.create({
        data: {
          actorId: teacherId,
          action: 'approve_class_enrollment',
          targetType: 'class_enrollment',
          targetId: enrollmentId,
          metadata: {
            studentId: enrollment.studentId,
            className: enrollment.class.name,
            relationshipId: relationship.id,
            accessGrantId: accessGrant.id,
            grantedScopes: ['progress:read', 'metrics:read', 'works:read'],
          },
        },
      });

      return {
        message: '学生入班申请已批准',
        enrollmentId,
        relationshipId: relationship.id,
        accessGrantId: accessGrant.id,
        student: enrollment.student,
        grantedScopes: ['progress:read', 'metrics:read', 'works:read'],
      };
    } else {
      // 记录拒绝日志
      await this.prisma.auditLog.create({
        data: {
          actorId: teacherId,
          action: 'reject_class_enrollment',
          targetType: 'class_enrollment',
          targetId: enrollmentId,
          metadata: {
            studentId: enrollment.studentId,
            className: enrollment.class.name,
          },
        },
      });

      return {
        message: '学生入班申请已拒绝',
        enrollmentId,
        student: enrollment.student,
      };
    }
  }

  // 学生退出班级
  async leaveClass(studentId: string, classId: string) {
    // 验证学生身份
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { role: true },
    });

    if (!student || student.role.name !== 'student') {
      throw new ForbiddenException('只有学生可以退出班级');
    }

    // 查找入班记录
    const enrollment = await this.prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: classId,
          studentId: studentId,
        },
      },
      include: {
        class: {
          include: {
            ownerTeacher: {
              select: { id: true, displayName: true },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('您不在该班级中');
    }

    if (enrollment.status !== 'ACTIVE') {
      throw new BadRequestException('您当前不在该班级中');
    }

    // 更新入班状态
    await this.prisma.classEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'REVOKED' },
    });

    // 撤销相关关系
    const relationship = await this.prisma.relationship.findFirst({
      where: {
        studentId: studentId,
        partyId: enrollment.class.ownerTeacher.id,
        partyRole: 'TEACHER',
        source: 'CLASS_INVITE',
        status: 'ACTIVE',
      },
    });

    if (relationship) {
      // 撤销关系
      await this.prisma.relationship.update({
        where: { id: relationship.id },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      });

      // 撤销相关授权
      await this.prisma.accessGrant.updateMany({
        where: {
          relationshipId: relationship.id,
          status: 'ACTIVE',
        },
        data: { status: 'REVOKED' },
      });
    }

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'leave_class',
        targetType: 'class',
        targetId: classId,
        metadata: {
          className: enrollment.class.name,
          teacherId: enrollment.class.ownerTeacher.id,
          relationshipId: relationship?.id,
        },
      },
    });

    return {
      message: '已成功退出班级',
      classId,
      className: enrollment.class.name,
      teacher: enrollment.class.ownerTeacher,
    };
  }

  // 获取教师的班级列表
  async getTeacherClasses(teacherId: string) {
    const classes = await this.prisma.class.findMany({
      where: {
        ownerTeacherId: teacherId,
        status: 'ACTIVE',
      },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
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
        },
        _count: {
          select: {
            enrollments: {
              where: { status: 'PENDING' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      code: cls.code,
      status: cls.status,
      studentCount: cls.enrollments.length,
      pendingCount: cls._count.enrollments,
      students: cls.enrollments.map((enrollment) => enrollment.student),
      createdAt: cls.createdAt,
      inviteUrl: `/classes/join/${cls.code}`,
    }));
  }

  // 获取学生的班级列表
  async getStudentClasses(studentId: string) {
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            ownerTeacher: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      class: {
        id: enrollment.class.id,
        name: enrollment.class.name,
        description: enrollment.class.description,
        code: enrollment.class.code,
        teacher: enrollment.class.ownerTeacher,
      },
      status: enrollment.status,
      joinedAt: enrollment.createdAt,
    }));
  }

  // 获取班级的待审批学生列表
  async getPendingEnrollments(teacherId: string, classId: string) {
    // 验证教师是否拥有该班级
    const classInfo = await this.prisma.class.findFirst({
      where: {
        id: classId,
        ownerTeacherId: teacherId,
        status: 'ACTIVE',
      },
    });

    if (!classInfo) {
      throw new ForbiddenException('您没有权限访问该班级');
    }

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        classId: classId,
        status: 'PENDING',
      },
      include: {
        student: {
          select: {
            id: true,
            displayName: true,
            nickname: true,
            school: true,
            className: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      student: enrollment.student,
      requestedAt: enrollment.createdAt,
    }));
  }

  // 更新班级信息
  async updateClass(
    teacherId: string,
    classId: string,
    updateData: {
      name?: string;
      description?: string;
      status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    },
  ) {
    // 验证教师是否拥有该班级
    const classInfo = await this.prisma.class.findFirst({
      where: {
        id: classId,
        ownerTeacherId: teacherId,
      },
    });

    if (!classInfo) {
      throw new ForbiddenException('您没有权限修改该班级');
    }

    const updatedClass = await this.prisma.class.update({
      where: { id: classId },
      data: updateData,
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: teacherId,
        action: 'update_class',
        targetType: 'class',
        targetId: classId,
        metadata: {
          oldData: {
            name: classInfo.name,
            description: classInfo.description,
            status: classInfo.status,
          },
          newData: updateData,
        },
      },
    });

    return updatedClass;
  }
}
