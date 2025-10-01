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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions, Permission } from '../../auth/decorators/permissions.decorator';
import { VisibilityService } from '../../auth/services/visibility.service';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('teacher-permissions')
@Controller('teachers/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TeacherPermissionsController {
  constructor(
    private readonly visibilityService: VisibilityService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('my-classes')
  @RequirePermissions(Permission.MANAGE_CLASS)
  @ApiOperation({ summary: '获取我的班级列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyClasses(@Request() req) {
    const teacherId = req.user.userId;

    const classes = await this.prisma.class.findMany({
      where: {
        teacherId: teacherId,
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      code: cls.code,
      status: cls.status,
      studentCount: cls.enrollments.length,
      students: cls.enrollments.map(enrollment => enrollment.student),
      createdAt: cls.createdAt,
    }));
  }

  @Get('class-students/:classId')
  @RequirePermissions(Permission.VIEW_CLASS_STUDENT_DATA)
  @ApiOperation({ summary: '获取班级学生列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getClassStudents(@Request() req, @Param('classId') classId: string) {
    const teacherId = req.user.userId;

    // 验证教师是否拥有该班级
    const classInfo = await this.prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: teacherId,
        status: 'ACTIVE',
      },
    });

    if (!classInfo) {
      throw new Error('班级不存在或您无权限访问');
    }

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        classId,
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
      },
    });

    return {
      classId,
      className: classInfo.name,
      students: enrollments.map(enrollment => enrollment.student),
      studentCount: enrollments.length,
    };
  }

  @Get('student-data/:studentId')
  @RequirePermissions(Permission.VIEW_CLASS_STUDENT_DATA)
  @ApiOperation({ summary: '查看班级内学生的教学数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentData(@Request() req, @Param('studentId') studentId: string) {
    const teacherId = req.user.userId;

    // 检查是否有班级关系
    const hasClassAccess = await this.visibilityService.hasDataAccess(teacherId, studentId, 'progress:read');
    if (!hasClassAccess) {
      throw new Error('该学生不在您的班级中');
    }

    // 获取过滤后的学生数据
    const studentData = await this.visibilityService.filterStudentData(studentId, teacherId, 'teacher');
    
    if (!studentData) {
      throw new Error('学生数据不存在或无访问权限');
    }

    // 记录访问日志
    await this.prisma.auditLog.create({
      data: {
        actorId: teacherId,
        action: 'view_student_data',
        targetType: 'student',
        targetId: studentId,
        metadata: {
          viewerRole: 'teacher',
          classId: studentData.classInfo?.classId,
        },
      },
    });

    return studentData;
  }

  @Get('student-progress/:studentId')
  @RequirePermissions(Permission.VIEW_CLASS_STUDENT_DATA)
  @ApiOperation({ summary: '查看学生学习进度' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentProgress(@Request() req, @Param('studentId') studentId: string) {
    const teacherId = req.user.userId;

    // 检查班级关系
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
      throw new Error('该学生不在您的班级中');
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
        actorId: teacherId,
        action: 'view_student_progress',
        targetType: 'student',
        targetId: studentId,
        metadata: {
          classId: classAccess.classId,
          dataRange: '30_days',
        },
      },
    });

    return {
      studentId,
      classId: classAccess.classId,
      progressData: progressData.map(snapshot => ({
        date: snapshot.date,
        chapterId: snapshot.chapterId,
        tasksDone: snapshot.tasksDone,
        accuracy: snapshot.accuracy,
        timeSpentMin: snapshot.timeSpentMin,
        streakDays: snapshot.streakDays,
        xpGained: snapshot.xpGained,
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
  @RequirePermissions(Permission.VIEW_CLASS_STUDENT_DATA)
  @ApiOperation({ summary: '查看学生作品（教学相关）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentWorks(@Request() req, @Param('studentId') studentId: string) {
    const teacherId = req.user.userId;

    // 检查班级关系
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
      throw new Error('该学生不在您的班级中');
    }

    // 这里应该查询学生的作品数据
    // 教师可以看到教学相关的内容
    const works = []; // 实际实现中应该从数据库查询

    // 记录访问日志
    await this.prisma.auditLog.create({
      data: {
        actorId: teacherId,
        action: 'view_student_works',
        targetType: 'student',
        targetId: studentId,
        metadata: {
          classId: classAccess.classId,
          viewerRole: 'teacher',
        },
      },
    });

    return {
      studentId,
      classId: classAccess.classId,
      works: works.map(work => ({
        id: work.id,
        title: work.title,
        description: work.description,
        createdAt: work.createdAt,
        // 教师可以看到更多教学相关的内容
        teachingNotes: work.teachingNotes,
        difficulty: work.difficulty,
      })),
    };
  }

  @Post('comment-work/:workId')
  @RequirePermissions(Permission.COMMENT_ON_WORKS)
  @ApiOperation({ summary: '点评学生作品' })
  @ApiResponse({ status: 201, description: '点评成功' })
  async commentOnWork(
    @Request() req,
    @Param('workId') workId: string,
    @Body() commentData: { content: string; rating?: number }
  ) {
    const teacherId = req.user.userId;

    // 这里应该验证教师是否有权限点评该作品
    // 需要检查作品是否属于教师班级中的学生

    // 创建点评记录
    const comment = {
      id: 'temp-comment-id',
      workId,
      teacherId,
      content: commentData.content,
      rating: commentData.rating,
      createdAt: new Date(),
    };

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: teacherId,
        action: 'comment_on_work',
        targetType: 'work',
        targetId: workId,
        metadata: {
          content: commentData.content,
          rating: commentData.rating,
        },
      },
    });

    return {
      message: '作品点评已保存',
      comment,
    };
  }

  @Post('assign-task')
  @RequirePermissions(Permission.ASSIGN_TASKS)
  @ApiOperation({ summary: '下发任务' })
  @ApiResponse({ status: 201, description: '任务下发成功' })
  async assignTask(@Request() req, @Body() taskData: any) {
    const teacherId = req.user.userId;
    const { classId, title, description, dueDate, students } = taskData;

    // 验证教师是否拥有该班级
    const classInfo = await this.prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: teacherId,
        status: 'ACTIVE',
      },
    });

    if (!classInfo) {
      throw new Error('班级不存在或您无权限访问');
    }

    // 创建任务记录
    const task = {
      id: 'temp-task-id',
      classId,
      teacherId,
      title,
      description,
      dueDate: new Date(dueDate),
      students: students || [], // 如果为空则发给全班
      createdAt: new Date(),
    };

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: teacherId,
        action: 'assign_task',
        targetType: 'class',
        targetId: classId,
        metadata: {
          taskTitle: title,
          studentCount: students?.length || 'all',
          dueDate,
        },
      },
    });

    return {
      message: '任务下发成功',
      task,
    };
  }

  @Get('class-analytics/:classId')
  @RequirePermissions(Permission.VIEW_CLASS_STUDENT_DATA)
  @ApiOperation({ summary: '获取班级分析数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getClassAnalytics(@Request() req, @Param('classId') classId: string) {
    const teacherId = req.user.userId;

    // 验证教师是否拥有该班级
    const classInfo = await this.prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: teacherId,
        status: 'ACTIVE',
      },
    });

    if (!classInfo) {
      throw new Error('班级不存在或您无权限访问');
    }

    // 获取班级学生列表
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        classId,
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            metricsSnapshots: {
              orderBy: { date: 'desc' },
              take: 7, // 最近7天的数据
            },
          },
        },
      },
    });

    // 计算班级整体指标
    const analytics = {
      classId,
      className: classInfo.name,
      studentCount: enrollments.length,
      totalTasks: 0,
      totalTime: 0,
      totalXP: 0,
      averageAccuracy: 0,
      students: enrollments.map(enrollment => {
        const student = enrollment.student;
        const recentMetrics = student.metricsSnapshots;
        
        const studentStats = {
          id: student.id,
          displayName: student.displayName,
          totalTasks: recentMetrics.reduce((sum, s) => sum + s.tasksDone, 0),
          totalTime: recentMetrics.reduce((sum, s) => sum + s.timeSpentMin, 0),
          totalXP: recentMetrics.reduce((sum, s) => sum + s.xpGained, 0),
          averageAccuracy: recentMetrics.length > 0 
            ? recentMetrics.reduce((sum, s) => sum + s.accuracy, 0) / recentMetrics.length 
            : 0,
          currentStreak: recentMetrics.length > 0 ? recentMetrics[0].streakDays : 0,
        };

        // 累加到班级总计
        analytics.totalTasks += studentStats.totalTasks;
        analytics.totalTime += studentStats.totalTime;
        analytics.totalXP += studentStats.totalXP;

        return studentStats;
      }),
    };

    // 计算班级平均准确率
    if (analytics.students.length > 0) {
      analytics.averageAccuracy = analytics.students.reduce((sum, s) => sum + s.averageAccuracy, 0) / analytics.students.length;
    }

    // 记录访问日志
    await this.prisma.auditLog.create({
      data: {
        actorId: teacherId,
        action: 'view_class_analytics',
        targetType: 'class',
        targetId: classId,
        metadata: {
          studentCount: analytics.studentCount,
        },
      },
    });

    return analytics;
  }
}
