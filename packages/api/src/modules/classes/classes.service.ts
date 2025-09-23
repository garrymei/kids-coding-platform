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
        description: createClassDto.description,
        ownerTeacherId: teacherId,
        inviteCode,
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
        ownerTeacherId: teacherId,
        isActive: true,
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
        ownerTeacherId: teacherId,
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
        ownerTeacherId: teacherId,
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
        ownerTeacherId: teacherId,
      },
    });

    if (!classData) {
      throw new NotFoundException('班级不存在或无权限');
    }

    return this.prisma.class.update({
      where: { id: classId },
      data: { isActive: false },
    });
  }

  async joinClass(studentId: string, joinClassDto: JoinClassDto) {
    // 查找班级
    const classData = await this.prisma.class.findUnique({
      where: {
        inviteCode: joinClassDto.inviteCode,
        isActive: true,
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
        ownerTeacherId: teacherId,
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
        ownerTeacherId: teacherId,
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
      select: { ownerTeacherId: true },
    });

    if (!classData) return;

    await this.prisma.accessGrant.createMany({
      data: [
        {
          resourceType: 'STUDENT_PROGRESS',
          resourceId: studentId,
          granteeId: classData.ownerTeacherId,
          scope: ['progress:read'],
        },
        {
          resourceType: 'STUDENT_WORKS',
          resourceId: studentId,
          granteeId: classData.ownerTeacherId,
          scope: ['works:read'],
        },
      ],
    });
  }

  private async revokeClassAccessGrants(studentId: string, classId: string) {
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { ownerTeacherId: true },
    });

    if (!classData) return;

    await this.prisma.accessGrant.updateMany({
      where: {
        resourceType: {
          in: ['STUDENT_PROGRESS', 'STUDENT_WORKS'],
        },
        resourceId: studentId,
        granteeId: classData.ownerTeacherId,
      },
      data: {
        status: 'REVOKED',
      },
    });
  }
}
