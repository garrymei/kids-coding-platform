import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { VisibilityService } from '../../auth/services/visibility.service';

export interface StudentTrendData {
  date: string;
  time_spent_min: number;
  tasks_done: number;
  accuracy: number;
  xp: number;
  streak: number;
}

export interface StudentComparisonData {
  studentId: string;
  studentName?: string; // 仅对教师显示真实姓名
  accuracy: number;
  tasks_done: number;
  time_spent_min: number;
  rank: number;
  isAnonymous?: boolean; // 是否为匿名数据（班级平均/分位）
}

export interface ComparisonRequest {
  studentIds: string[];
  metrics: string[];
  window: string;
}

@Injectable()
export class MetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibilityService: VisibilityService,
  ) {}

  // 获取学生成长趋势（纵向）
  async getStudentTrend(
    requesterId: string,
    studentId: string,
    from: string,
    to: string,
    granularity: 'day' | 'week' = 'day',
  ): Promise<StudentTrendData[]> {
    // 验证权限
    const hasAccess = await this.visibilityService.checkStudentAccess(
      requesterId,
      studentId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('您没有权限查看该学生的数据');
    }

    // 验证学生存在
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { role: true },
    });

    if (!student || student.role.name !== 'student') {
      throw new NotFoundException('学生不存在');
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // 根据粒度调整查询
    let groupByClause: string;
    let dateFormat: string;

    if (granularity === 'week') {
      groupByClause = `DATE_TRUNC('week', date)`;
      dateFormat = `DATE_TRUNC('week', date)::date`;
    } else {
      groupByClause = `date`;
      dateFormat = `date`;
    }

    // 查询指标快照数据
    const trendData = await this.prisma.$queryRaw<
      Array<{
        date: Date;
        time_spent_min: number;
        tasks_done: number;
        accuracy: number;
        xp: number;
        streak: number;
      }>
    >`
      SELECT 
        ${dateFormat} as date,
        COALESCE(SUM(tasks_done), 0) as tasks_done,
        COALESCE(AVG(accuracy), 0) as accuracy,
        COALESCE(SUM(time_spent_min), 0) as time_spent_min,
        COALESCE(SUM(xp_gained), 0) as xp,
        COALESCE(MAX(streak_days), 0) as streak
      FROM metrics_snapshots 
      WHERE student_id = ${studentId}
        AND date >= ${fromDate}
        AND date <= ${toDate}
      GROUP BY ${groupByClause}
      ORDER BY date ASC
    `;

    // 填充缺失的日期
    const result = this.fillMissingDates(
      trendData,
      fromDate,
      toDate,
      granularity,
    );

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: requesterId,
        action: 'view_student_trend',
        targetType: 'student',
        targetId: studentId,
        metadata: {
          from,
          to,
          granularity,
          dataPoints: result.length,
        },
      },
    });

    return result;
  }

  // 多学生对比（横向）
  async compareStudents(
    requesterId: string,
    comparisonRequest: ComparisonRequest,
  ): Promise<StudentComparisonData[]> {
    const { studentIds, metrics, window } = comparisonRequest;

    // 验证请求者身份和权限
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      include: { role: true },
    });

    if (!requester) {
      throw new NotFoundException('用户不存在');
    }

    const isTeacher = requester.role.name === 'teacher';
    const isParent = requester.role.name === 'parent';

    // 计算时间窗口
    const windowDays = this.parseWindow(window);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - windowDays);

    let accessibleStudentIds: string[] = [];
    let classId: string | null = null;

    if (isTeacher) {
      // 教师只能对比同班级学生
      const teacherClasses = await this.prisma.class.findMany({
        where: { ownerTeacherId: requesterId, status: 'ACTIVE' },
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            select: { studentId: true },
          },
        },
      });

      const classStudentIds = teacherClasses.flatMap((cls) =>
        cls.enrollments.map((enrollment) => enrollment.studentId),
      );

      accessibleStudentIds = studentIds.filter((id) =>
        classStudentIds.includes(id),
      );

      if (teacherClasses.length > 0) {
        classId = teacherClasses[0].id; // 假设教师只在一个班级中对比
      }
    } else if (isParent) {
      // 家长只能对比自己的孩子
      const parentRelationships = await this.prisma.relationship.findMany({
        where: {
          partyId: requesterId,
          partyRole: 'PARENT',
          status: 'ACTIVE',
        },
        select: { studentId: true },
      });

      const parentStudentIds = parentRelationships.map((rel) => rel.studentId);
      accessibleStudentIds = studentIds.filter((id) =>
        parentStudentIds.includes(id),
      );
    } else {
      throw new ForbiddenException('只有家长和教师可以对比学生数据');
    }

    if (accessibleStudentIds.length === 0) {
      throw new ForbiddenException('您没有权限查看这些学生的数据');
    }

    // 查询学生指标数据
    const studentMetrics = await this.getStudentMetrics(
      accessibleStudentIds,
      startDate,
      endDate,
      metrics,
    );

    // 计算排名
    const rankedData = this.calculateRankings(studentMetrics, metrics);

    // 根据用户角色决定是否显示真实姓名
    const result = await this.formatComparisonResult(
      rankedData,
      requesterId,
      isTeacher,
      isParent,
      classId,
    );

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: requesterId,
        action: 'compare_students',
        targetType: 'student',
        targetId: accessibleStudentIds.join(','),
        metadata: {
          studentIds: accessibleStudentIds,
          metrics,
          window,
          resultCount: result.length,
        },
      },
    });

    return result;
  }

  // 获取学生指标数据
  private async getStudentMetrics(
    studentIds: string[],
    startDate: Date,
    endDate: Date,
    metrics: string[],
  ) {
    const metricsQuery = metrics
      .map((metric) => {
        switch (metric) {
          case 'accuracy':
            return 'AVG(accuracy) as accuracy';
          case 'tasks_done':
            return 'SUM(tasks_done) as tasks_done';
          case 'time_spent_min':
            return 'SUM(time_spent_min) as time_spent_min';
          case 'xp_gained':
            return 'SUM(xp_gained) as xp_gained';
          case 'streak_days':
            return 'MAX(streak_days) as streak_days';
          default:
            return '0 as ' + metric;
        }
      })
      .join(', ');

    const result = await this.prisma.$queryRaw<
      Array<{
        student_id: string;
        accuracy: number;
        tasks_done: number;
        time_spent_min: number;
        xp_gained: number;
        streak_days: number;
      }>
    >`
      SELECT 
        student_id,
        ${metricsQuery}
      FROM metrics_snapshots 
      WHERE student_id = ANY(${studentIds})
        AND date >= ${startDate}
        AND date <= ${endDate}
      GROUP BY student_id
    `;

    return result;
  }

  // 计算排名
  private calculateRankings(
    studentMetrics: Array<{
      student_id: string;
      accuracy: number;
      tasks_done: number;
      time_spent_min: number;
      xp_gained: number;
      streak_days: number;
    }>,
    metrics: string[],
  ): StudentComparisonData[] {
    // 为每个指标计算排名
    const rankings = new Map<string, number>();

    metrics.forEach((metric) => {
      const sortedData = [...studentMetrics].sort((a, b) => {
        const aValue = a[metric as keyof typeof a] as number;
        const bValue = b[metric as keyof typeof b] as number;
        return bValue - aValue; // 降序排列
      });

      sortedData.forEach((item, index) => {
        const key = `${item.student_id}_${metric}`;
        rankings.set(key, index + 1);
      });
    });

    // 计算综合排名（基于所有指标的平均排名）
    const studentRankings = new Map<string, number[]>();

    studentMetrics.forEach((student) => {
      const studentRanks: number[] = [];
      metrics.forEach((metric) => {
        const key = `${student.student_id}_${metric}`;
        const rank = rankings.get(key) || 0;
        studentRanks.push(rank);
      });
      studentRankings.set(student.student_id, studentRanks);
    });

    // 生成结果
    return studentMetrics.map((student) => {
      const ranks = studentRankings.get(student.student_id) || [];
      const averageRank =
        ranks.length > 0 ? ranks.reduce((a, b) => a + b, 0) / ranks.length : 0;

      return {
        studentId: student.student_id,
        accuracy: student.accuracy,
        tasks_done: student.tasks_done,
        time_spent_min: student.time_spent_min,
        rank: Math.round(averageRank),
      };
    });
  }

  // 格式化对比结果
  private async formatComparisonResult(
    rankedData: StudentComparisonData[],
    requesterId: string,
    isTeacher: boolean,
    isParent: boolean,
    classId: string | null,
  ): Promise<StudentComparisonData[]> {
    const result: StudentComparisonData[] = [];

    // 获取学生信息
    const studentIds = rankedData.map((item) => item.studentId);
    const students = await this.prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        displayName: true,
        nickname: true,
      },
    });

    const studentMap = new Map(students.map((s) => [s.id, s]));

    // 处理每个学生的数据
    rankedData.forEach((item) => {
      const student = studentMap.get(item.studentId);
      if (student) {
        if (isTeacher) {
          // 教师可以看到真实姓名
          result.push({
            ...item,
            studentName: student.displayName,
          });
        } else if (isParent) {
          // 家长只能看到自己孩子的真实姓名
          result.push({
            ...item,
            studentName: student.displayName,
          });
        } else {
          // 其他情况匿名化
          result.push({
            ...item,
            studentName: `学生${item.studentId.slice(-4)}`,
            isAnonymous: true,
          });
        }
      }
    });

    // 如果是教师，添加班级统计信息
    if (isTeacher && classId) {
      const classStats = await this.getClassStatistics(classId, rankedData);
      result.push(...classStats);
    }

    return result;
  }

  // 获取班级统计信息
  private async getClassStatistics(
    classId: string,
    studentData: StudentComparisonData[],
  ): Promise<StudentComparisonData[]> {
    const stats: StudentComparisonData[] = [];

    if (studentData.length === 0) return stats;

    // 计算班级平均值
    const avgAccuracy =
      studentData.reduce((sum, item) => sum + item.accuracy, 0) /
      studentData.length;
    const avgTasksDone =
      studentData.reduce((sum, item) => sum + item.tasks_done, 0) /
      studentData.length;
    const avgTimeSpent =
      studentData.reduce((sum, item) => sum + item.time_spent_min, 0) /
      studentData.length;

    // 计算分位数
    const sortedAccuracy = [...studentData].sort(
      (a, b) => a.accuracy - b.accuracy,
    );
    const sortedTasksDone = [...studentData].sort(
      (a, b) => a.tasks_done - b.tasks_done,
    );
    const sortedTimeSpent = [...studentData].sort(
      (a, b) => a.time_spent_min - b.time_spent_min,
    );

    const p50Index = Math.floor(sortedAccuracy.length * 0.5);
    const p90Index = Math.floor(sortedAccuracy.length * 0.9);

    // 添加班级平均
    stats.push({
      studentId: 'class_avg',
      studentName: '班级平均',
      accuracy: Math.round(avgAccuracy * 100) / 100,
      tasks_done: Math.round(avgTasksDone),
      time_spent_min: Math.round(avgTimeSpent),
      rank: 0,
      isAnonymous: true,
    });

    // 添加P50分位
    if (sortedAccuracy.length > 0) {
      stats.push({
        studentId: 'class_p50',
        studentName: '班级中位数(P50)',
        accuracy: sortedAccuracy[p50Index]?.accuracy || 0,
        tasks_done: sortedTasksDone[p50Index]?.tasks_done || 0,
        time_spent_min: sortedTimeSpent[p50Index]?.time_spent_min || 0,
        rank: 0,
        isAnonymous: true,
      });
    }

    // 添加P90分位
    if (sortedAccuracy.length > 0 && p90Index < sortedAccuracy.length) {
      stats.push({
        studentId: 'class_p90',
        studentName: '班级优秀线(P90)',
        accuracy: sortedAccuracy[p90Index]?.accuracy || 0,
        tasks_done: sortedTasksDone[p90Index]?.tasks_done || 0,
        time_spent_min: sortedTimeSpent[p90Index]?.time_spent_min || 0,
        rank: 0,
        isAnonymous: true,
      });
    }

    return stats;
  }

  // 填充缺失的日期
  private fillMissingDates(
    data: Array<{
      date: Date;
      time_spent_min: number;
      tasks_done: number;
      accuracy: number;
      xp: number;
      streak: number;
    }>,
    fromDate: Date,
    toDate: Date,
    granularity: 'day' | 'week',
  ): StudentTrendData[] {
    const result: StudentTrendData[] = [];
    const dataMap = new Map(
      data.map((item) => [item.date.toISOString().split('T')[0], item]),
    );

    const current = new Date(fromDate);
    const end = new Date(toDate);

    while (current <= end) {
      const dateKey = current.toISOString().split('T')[0];
      const existingData = dataMap.get(dateKey);

      if (existingData) {
        result.push({
          date: dateKey,
          time_spent_min: existingData.time_spent_min,
          tasks_done: existingData.tasks_done,
          accuracy: existingData.accuracy,
          xp: existingData.xp,
          streak: existingData.streak,
        });
      } else {
        result.push({
          date: dateKey,
          time_spent_min: 0,
          tasks_done: 0,
          accuracy: 0,
          xp: 0,
          streak: 0,
        });
      }

      if (granularity === 'week') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setDate(current.getDate() + 1);
      }
    }

    return result;
  }

  // 解析时间窗口
  private parseWindow(window: string): number {
    const match = window.match(/last_(\d+)d/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 14; // 默认14天
  }
}
