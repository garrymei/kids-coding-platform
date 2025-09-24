import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';
import { ClassesService } from './classes.service';
import {
  CreateClassDto,
  UpdateClassDto,
  JoinClassDto,
  ApproveEnrollmentDto,
  RejectEnrollmentDto,
} from './dto/classes.dto';

@ApiTags('classes')
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(Role.Teacher)
  @ApiOperation({ summary: '创建班级' })
  @ApiResponse({ status: 201, description: '班级创建成功' })
  async createClass(@Request() req, @Body() createClassDto: CreateClassDto) {
    return this.classesService.createClass(req.user.userId, createClassDto);
  }

  @Get()
  @Roles(Role.Teacher)
  @ApiOperation({ summary: '获取教师的班级列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTeacherClasses(@Request() req) {
    return this.classesService.getClassesByTeacher(req.user.userId);
  }

  @Get(':id')
  @Roles(Role.Teacher)
  @ApiOperation({ summary: '获取班级详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getClassById(@Request() req, @Param('id') classId: string) {
    return this.classesService.getClassById(classId, req.user.userId);
  }

  @Put(':id')
  @Roles(Role.Teacher)
  @ApiOperation({ summary: '更新班级信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateClass(
    @Request() req,
    @Param('id') classId: string,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    return this.classesService.updateClass(
      classId,
      req.user.userId,
      updateClassDto,
    );
  }

  @Delete(':id')
  @Roles(Role.Teacher)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除班级' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async deleteClass(@Request() req, @Param('id') classId: string) {
    return this.classesService.deleteClass(classId, req.user.userId);
  }

  @Post('join')
  @Roles(Role.Student)
  @ApiOperation({ summary: '学生加入班级' })
  @ApiResponse({ status: 201, description: '加入成功' })
  async joinClass(@Request() req, @Body() joinClassDto: JoinClassDto) {
    return this.classesService.joinClass(req.user.userId, joinClassDto);
  }

  @Get('my-classes')
  @Roles(Role.Student)
  @ApiOperation({ summary: '获取学生的班级列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentClasses(@Request() req) {
    return this.classesService.getStudentClasses(req.user.userId);
  }

  @Post(':id/approve')
  @Roles(Role.Teacher)
  @ApiOperation({ summary: '批准学生加入班级' })
  @ApiResponse({ status: 200, description: '批准成功' })
  async approveEnrollment(
    @Request() req,
    @Param('id') classId: string,
    @Body() approveDto: ApproveEnrollmentDto,
  ) {
    return this.classesService.approveEnrollment(
      classId,
      approveDto.enrollmentId,
      req.user.userId,
    );
  }

  @Post(':id/reject')
  @Roles(Role.Teacher)
  @ApiOperation({ summary: '拒绝学生加入班级' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  async rejectEnrollment(
    @Request() req,
    @Param('id') classId: string,
    @Body() rejectDto: RejectEnrollmentDto,
  ) {
    return this.classesService.rejectEnrollment(
      classId,
      rejectDto.enrollmentId,
      req.user.userId,
    );
  }

  @Post(':id/leave')
  @Roles(Role.Student)
  @ApiOperation({ summary: '学生退出班级' })
  @ApiResponse({ status: 200, description: '退出成功' })
  async leaveClass(@Request() req, @Param('id') classId: string) {
    return this.classesService.leaveClass(classId, req.user.userId);
  }
}
