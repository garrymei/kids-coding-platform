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

@ApiTags('class-management')
@Controller('classes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ClassManagementController {
  constructor(
    private readonly classManagementService: ClassManagementService,
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
    return this.classManagementService.createClass(teacherId, classData);
  }

  @Post('join')
  @RequirePermissions(Permission.VIEW_OWN_AUDIT) // 学生权限
  @ApiOperation({ summary: '学生加入班级' })
  @ApiResponse({ status: 201, description: '入班申请已提交' })
  async joinClass(@Request() req, @Body() joinData: JoinClassDto) {
    const studentId = req.user.userId;
    return this.classManagementService.joinClass(studentId, joinData.code);
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
    return this.classManagementService.approveEnrollment(
      teacherId,
      enrollmentId,
      decision.action,
    );
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
    return this.classManagementService.leaveClass(studentId, classId);
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
    return this.classManagementService.updateClass(
      teacherId,
      classId,
      updateData,
    );
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
}
