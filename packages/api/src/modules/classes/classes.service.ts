import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassDto, JoinClassDto, UpdateClassDto } from './dto/classes.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async createClass(teacherId: string, createClassDto: CreateClassDto) {
    // 生成唯一的邀请码
    const inviteCode = this.generateInviteCode();

    const classData = await this.prisma.class.create({
      data: {
        name: createClassDto.name,
        teacherId: teacherId,
        code: inviteCode,
        codeTTL: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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

    return classData;
  }

  async getClassesByTeacher(teacherId: string) {
    return this.prisma.class.findMany({
      where: {
        teacherId: teacherId,
        status: 'ACTIVE',
      },
      include: {
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getClassById(classId: string, teacherId: string) {
    const classData = await this.prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: teacherId,
      },
      include: {
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        ownerTeacher: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException('班级不存在');
    }

    return classData;
  }

  async updateClass(classId: string, teacherId: string, updateClassDto: UpdateClassDto) {
    // 验证班级所有权
    const classData = await this.prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: teacherId,
      },
    });

    if (!classData) {
      throw new NotFoundException('班级不存在或无权限');
    }

    return this.prisma.class.update({
      where: { id: classId },
      data: updateClassDto,
    });
  }

  async deleteClass(classId: string, teacherId: string) {
    // 验证班级所有权
    const classData = await this.prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: teacherId,
      },
    });

    if (!classData) {
      throw new NotFoundException('班级不存在或无权限');
    }

    return this.prisma.class.update({
      where: { id: classId },
      data: { status: 'INACTIVE' },
    });
  }

  async joinClass(studentId: string, joinClassDto: JoinClassDto) {
    // 查找班级
    const classData = await this.prisma.class.findUnique({
      where: {
        code: joinClassDto.inviteCode,
        status: 'ACTIVE',
      },
    });

    if (!classData) {
      throw new NotFoundException('邀请码无效或班级不存在');
    }

    // 检查是否已经加入
    const existingEnrollment = await this.prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: classData.id,
          studentId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ForbiddenException('您已经加入该班级');
    }

    // 创建注册记录
    const enrollment = await this.prisma.classEnrollment.create({
      data: {
        classId: classData.id,
        studentId,
        status: 'PENDING',
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            description: true,
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
    });

    return enrollment;
  }

  async approveEnrollment(classId: string, enrollmentId: string, teacherId: string) {
    // 验证班级所有权
    const classData = await this.prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: teacherId,
      },
    });

    if (!classData) {
      throw new NotFoundException('班级不存在或无权限');
    }

    // 更新注册状态
    const enrollment = await this.prisma.classEnrollment.update({
      where: {
        id: enrollmentId,
        classId,
      },
      data: {
        status: 'ACTIVE',
      },
      include: {
        student: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    // 自动创建访问授权
    await this.createClassAccessGrants(enrollment.studentId, classId);

    return enrollment;
  }

  async rejectEnrollment(classId: string, enrollmentId: string, teacherId: string) {
    // 验证班级所有权
    const classData = await this.prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: teacherId,
      },
    });

    if (!classData) {
      throw new NotFoundException('班级不存在或无权限');
    }

    return this.prisma.classEnrollment.update({
      where: {
        id: enrollmentId,
        classId,
      },
      data: {
        status: 'REVOKED',
      },
    });
  }

  async getStudentClasses(studentId: string) {
    return this.prisma.classEnrollment.findMany({
      where: {
        studentId,
        status: 'ACTIVE',
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            description: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async leaveClass(classId: string, studentId: string) {
    const enrollment = await this.prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('您未加入该班级');
    }

    // 更新注册状态
    await this.prisma.classEnrollment.update({
      where: {
        id: enrollment.id,
      },
      data: {
        status: 'REVOKED',
      },
    });

    // 撤销相关访问授权
    await this.revokeClassAccessGrants(studentId, classId);

    return { message: '已退出班级' };
  }

  private generateInviteCode(): string {
    return randomBytes(6).toString('hex').toUpperCase();
  }

  private async createClassAccessGrants(studentId: string, classId: string) {
    // 为班级教师创建访问学生数据的授权
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { teacherId: true },
    });

    if (!classData) return;

      await this.prisma.accessGrant.createMany({
        data: [
          {
            studentId,
            granteeId: classData.teacherId,
            scope: ['progress:read'],
            status: 'active',
            grantedAt: new Date(),
          },
        {
          studentId,
          granteeId: classData.teacherId,
          scope: ['works:read'],
          status: 'active',
          grantedAt: new Date(),
        },
      ],
    });
  }

  private async revokeClassAccessGrants(studentId: string, classId: string) {
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { teacherId: true },
    });

    if (!classData) return;

    await this.prisma.accessGrant.updateMany({
      where: {
        studentId,
        granteeId: classData.teacherId,
      },
      data: {
        status: 'REVOKED',
      },
    });
  }
}
