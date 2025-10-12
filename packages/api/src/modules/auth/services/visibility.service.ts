import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class VisibilityService {
  constructor(private readonly prisma: PrismaService) {}

  // 过滤学生数据，根据权限返回可见部分
  async filterStudentData(
    studentId: string,
    viewerId: string,
    viewerRole: string,
  ) {
    const baseData = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: {
        metricsSnapshots: true,
        // 这里可以添加更多需要过滤的数据
      },
    });

    if (!baseData) {
      return null;
    }

    // 学生查看自己的数据
    if (studentId === viewerId) {
      return this.getFullStudentData(baseData);
    }

    // 根据查看者角色过滤数据
    switch (viewerRole) {
      case 'parent':
        return this.filterForParent(baseData, viewerId);
      case 'teacher':
        return this.filterForTeacher(baseData, viewerId);
      case 'admin':
        return this.filterForAdmin(baseData);
      default:
        return null;
    }
  }

  // 学生查看自己的完整数据
  private getFullStudentData(student: any) {
    return {
      id: student.id,
      email: student.email,
      displayName: student.displayName,
      nickname: student.nickname,
      school: student.school,
      className: student.className,
      discoverable: student.discoverable,
      role: student.role,
      // 完整的学习数据
      learningData: {
        progress: student.metricsSnapshots,
        // 可以添加更多学习相关数据
      },
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  // 家长查看数据 - 仅授权范围内的只读数据
  private async filterForParent(student: any, parentId: string) {
    // 检查家长是否有授权
    const accessGrant = await this.prisma.accessGrant.findFirst({
      where: {
        granteeId: parentId,
        studentId: student.id,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!accessGrant) {
      return null; // 无授权，返回空
    }

    const filteredData: any = {
      id: student.id,
      displayName: student.displayName,
      // 不包含邮箱等敏感信息
    };

    // 根据授权范围添加数据
    if (accessGrant.scope.includes('profile:read')) {
      filteredData.nickname = student.nickname;
      filteredData.school = student.school;
      filteredData.className = student.className;
    }

    if (accessGrant.scope.includes('progress:read')) {
      filteredData.learningProgress = this.filterProgressData(
        student.metricsSnapshots,
      );
    }

    if (accessGrant.scope.includes('works:read')) {
      // 这里应该过滤作品数据，默认不含代码内容
      filteredData.works = await this.getFilteredWorks(student.id, 'parent');
    }

    if (accessGrant.scope.includes('metrics:read')) {
      filteredData.metrics = this.filterMetricsData(student.metricsSnapshots);
    }

    // 添加授权信息
    filteredData.accessInfo = {
      grantedBy: 'student',
      grantedAt: accessGrant.createdAt,
      expiresAt: accessGrant.expiresAt,
      scopes: accessGrant.scope,
    };

    return filteredData;
  }

  // 教师查看数据 - 班级关系内的教学相关数据
  private async filterForTeacher(student: any, teacherId: string) {
    // 检查教师是否有班级关系
    const classAccess = await this.prisma.classEnrollment.findFirst({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
        class: {
          teacherId: teacherId,
          status: 'ACTIVE',
        },
      },
      include: {
        class: true,
      },
    });

    if (!classAccess) {
      return null; // 无班级关系，返回空
    }

    const filteredData: any = {
      id: student.id,
      displayName: student.displayName,
      nickname: student.nickname,
      school: student.school,
      className: student.className,
    };

    // 教师可以查看教学相关数据
    filteredData.teachingData = {
      progress: this.filterProgressData(student.metricsSnapshots),
      metrics: this.filterMetricsData(student.metricsSnapshots),
      works: await this.getFilteredWorks(student.id, 'teacher'),
      // 可以添加更多教学相关数据
    };

    // 添加班级信息
    filteredData.classInfo = {
      classId: classAccess.class.id,
      className: classAccess.class.name,
      enrolledAt: classAccess.createdAt,
    };

    return filteredData;
  }

  // 管理员查看数据 - 系统运维相关数据
  private filterForAdmin(student: any) {
    return {
      id: student.id,
      email: student.email,
      displayName: student.displayName,
      nickname: student.nickname,
      school: student.school,
      className: student.className,
      discoverable: student.discoverable,
      role: student.role,
      // 管理员可以查看系统相关数据，但不能查看学习内容
      systemData: {
        accountStatus: 'active', // 账户状态
        lastLogin: student.updatedAt,
        // 不包含具体的学习数据
      },
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  // 过滤进度数据
  private filterProgressData(metricsSnapshots: any[]) {
    return metricsSnapshots.map((snapshot) => ({
      date: snapshot.date,
      tasksDone: snapshot.tasksDone,
      accuracy: snapshot.accuracy,
      timeSpentMin: snapshot.timeSpentMin,
      streakDays: snapshot.streakDays,
      xpGained: snapshot.xpGained,
      // 不包含具体的任务详情
    }));
  }

  // 过滤指标数据
  private filterMetricsData(metricsSnapshots: any[]) {
    // 计算总体指标
    const totalTasks = metricsSnapshots.reduce(
      (sum, s) => sum + s.tasksDone,
      0,
    );
    const totalTime = metricsSnapshots.reduce(
      (sum, s) => sum + s.timeSpentMin,
      0,
    );
    const totalXP = metricsSnapshots.reduce((sum, s) => sum + s.xpGained, 0);
    const avgAccuracy =
      metricsSnapshots.length > 0
        ? metricsSnapshots.reduce((sum, s) => sum + s.accuracy, 0) /
          metricsSnapshots.length
        : 0;

    return {
      totalTasks,
      totalTime,
      totalXP,
      averageAccuracy: avgAccuracy,
      currentStreak:
        metricsSnapshots.length > 0 ? metricsSnapshots[0].streakDays : 0,
      // 不包含具体的学习轨迹
    };
  }

  // 获取过滤后的作品数据
  private async getFilteredWorks(
    studentId: string,
    viewerType: 'parent' | 'teacher',
  ) {
    // 这里应该查询学生的作品数据
    // 根据查看者类型过滤内容

    if (viewerType === 'parent') {
      // 家长只能看到成果，不能看到代码
      return {
        works: [], // 这里应该返回过滤后的作品列表
        note: '家长只能查看学习成果，不能查看代码内容',
      };
    } else if (viewerType === 'teacher') {
      // 教师可以看到教学相关的内容
      return {
        works: [], // 这里应该返回教师可见的作品列表
        note: '教师可以查看教学相关内容',
      };
    }

    return { works: [] };
  }

  // 检查用户是否有权限查看特定数据
  async hasDataAccess(
    viewerId: string,
    targetStudentId: string,
    dataType: string,
  ): Promise<boolean> {
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
    });

    if (!viewer) {
      return false;
    }

    // 学生查看自己的数据
    if (viewerId === targetStudentId) {
      return true;
    }

    // 根据角色检查权限
    switch (viewer.role) {
      case 'parent':
        return this.checkParentAccess(viewerId, targetStudentId, dataType);
      case 'teacher':
        return this.checkTeacherAccess(viewerId, targetStudentId, dataType);
      case 'admin':
        return this.checkAdminAccess(dataType);
      default:
        return false;
    }
  }

  private async checkParentAccess(
    parentId: string,
    studentId: string,
    dataType: string,
  ): Promise<boolean> {
    const accessGrant = await this.prisma.accessGrant.findFirst({
      where: {
        granteeId: parentId,
        studentId,
        status: 'ACTIVE',
        scope: { contains: dataType },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return !!accessGrant;
  }

  private async checkTeacherAccess(
    teacherId: string,
    studentId: string,
    dataType: string,
  ): Promise<boolean> {
    // 检查是否有班级关系
    const classAccess = await this.prisma.classEnrollment.findFirst({
      where: {
        studentId,
        status: 'ACTIVE',
        class: {
          teacherId: teacherId,
          status: 'ACTIVE',
        },
      },
    });

    if (!classAccess) {
      return false;
    }

    // 教师可以查看教学相关数据
    const teachingDataTypes = ['progress:read', 'works:read', 'metrics:read'];
    return teachingDataTypes.includes(dataType);
  }

  private checkAdminAccess(dataType: string): boolean {
    // 管理员只能查看系统相关数据，不能查看学习内容
    const systemDataTypes = ['profile:read', 'system:read'];
    return systemDataTypes.includes(dataType);
  }
}
