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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';
import { StudentsService } from './students.service';
import {
  UpdateSearchabilityDto,
  SearchStudentDto,
  CreateFollowRequestDto,
  GenerateShareCodeDto,
} from './dto/students.dto';
import { GetConsentsDto } from './dto/get-consents.dto';

@ApiTags('students')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('consents')
  @Roles(Role.Student)
  @ApiOperation({ summary: '学生查看收到的授权申请' })
  getConsents(@Query() getConsentsDto: GetConsentsDto, @Request() req) {
    const studentId = req.user.id;
    return this.studentsService.getConsents(studentId, getConsentsDto.status);
  }

  @Post('consents/:requestId/approve')
  @Roles(Role.Student)
  @ApiOperation({ summary: '学生同意授权申请' })
  approveConsent(@Param('requestId') requestId: string, @Request() req) {
    const studentId = req.user.id;
    return this.studentsService.approveConsent(requestId, studentId);
  }

  @Post('consents/:requestId/reject')
  @Roles(Role.Student)
  @ApiOperation({ summary: '学生拒绝授权申请' })
  rejectConsent(@Param('requestId') requestId: string, @Request() req) {
    const studentId = req.user.id;
    return this.studentsService.rejectConsent(requestId, studentId);
  }

  @Post('consents/:requestId/revoke')
  @Roles(Role.Student)
  @ApiOperation({ summary: '学生撤销已同意的授权' })
  revokeConsent(@Param('requestId') requestId: string, @Request() req) {
    const studentId = req.user.id;
    return this.studentsService.revokeConsent(requestId, studentId);
  }

  @Put('search-settings')
  @Roles(Role.Student)
  @ApiOperation({ summary: '更新搜索设置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateSearchability(
    @Request() req,
    @Body() updateDto: UpdateSearchabilityDto,
  ) {
    return this.studentsService.updateSearchability(req.user.userId, updateDto);
  }

  @Get('search-settings')
  @Roles(Role.Student)
  @ApiOperation({ summary: '获取搜索设置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSearchSettings(@Request() req) {
    return this.studentsService.getSearchSettings(req.user.userId);
  }

  @Get('search-explanation')
  @Roles(Role.Student)
  @ApiOperation({ summary: '获取搜索功能说明' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSearchExplanation() {
    return this.studentsService.getSearchExplanation();
  }

  @Get('search')
  @Roles(Role.Parent, Role.Teacher)
  @ApiOperation({ summary: '搜索可关注的学生' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchStudents(@Query() searchDto: SearchStudentDto) {
    return this.studentsService.searchStudents(searchDto);
  }

  @Post('follow-request')
  @Roles(Role.Parent, Role.Teacher)
  @ApiOperation({ summary: '创建关注申请' })
  @ApiResponse({ status: 201, description: '申请创建成功' })
  async createFollowRequest(
    @Request() req,
    @Body() createDto: CreateFollowRequestDto,
  ) {
    return this.studentsService.createFollowRequest(req.user.userId, createDto);
  }

  @Post('share-code')
  @Roles(Role.Student)
  @ApiOperation({ summary: '生成分享码' })
  @ApiResponse({ status: 201, description: '分享码生成成功' })
  async generateShareCode(
    @Request() req,
    @Body() generateDto: GenerateShareCodeDto,
  ) {
    return this.studentsService.generateShareCode(req.user.userId, generateDto);
  }

  @Get('share-code/:code')
  @ApiOperation({ summary: '通过分享码查找学生' })
  @ApiResponse({ status: 200, description: '查找成功' })
  async findStudentByShareCode(@Param('code') code: string) {
    return this.studentsService.findStudentByShareCode(code);
  }

  @Get('share-qr/:code')
  @ApiOperation({ summary: '生成分享码二维码' })
  @ApiResponse({ status: 200, description: '二维码生成成功' })
  async generateShareQRCode(@Param('code') code: string) {
    // 这里应该生成二维码图片
    return {
      qrCodeUrl: `/api/students/share-qr/${code}`,
      shareCode: code,
    };
  }
}
