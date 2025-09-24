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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RelationshipsService } from './relationships.service';
import {
  RequestParentAccessDto,
  RequestTeacherAccessDto,
  RespondToAccessRequestDto,
  UpdateRelationshipDto,
  UpdateAccessGrantDto,
} from './dto/relationships.dto';

@ApiTags('relationships')
@Controller('relationships')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Post('request-parent-access')
  @Roles(Role.Parent)
  @ApiOperation({ summary: '家长申请查看学生数据' })
  @ApiResponse({ status: 201, description: '申请提交成功' })
  async requestParentAccess(
    @Request() req,
    @Body() requestDto: RequestParentAccessDto,
  ) {
    return this.relationshipsService.requestParentAccess(
      req.user.userId,
      requestDto,
    );
  }

  @Post('request-teacher-access')
  @Roles(Role.Teacher)
  @ApiOperation({ summary: '教师申请查看学生数据' })
  @ApiResponse({ status: 201, description: '申请提交成功' })
  async requestTeacherAccess(
    @Request() req,
    @Body() requestDto: RequestTeacherAccessDto,
  ) {
    return this.relationshipsService.requestTeacherAccess(
      req.user.userId,
      requestDto,
    );
  }

  @Post('respond-to-request')
  @Roles(Role.Student)
  @ApiOperation({ summary: '学生响应访问请求' })
  @ApiResponse({ status: 200, description: '响应成功' })
  async respondToAccessRequest(
    @Request() req,
    @Body() responseDto: RespondToAccessRequestDto,
  ) {
    return this.relationshipsService.respondToAccessRequest(
      req.user.userId,
      responseDto,
    );
  }

  @Get('pending-requests')
  @Roles(Role.Student)
  @ApiOperation({ summary: '获取待处理的访问请求' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPendingRequests(@Request() req) {
    return this.relationshipsService.getPendingRequests(req.user.userId);
  }

  @Get('my-relationships')
  @Roles(Role.Student, Role.Parent, Role.Teacher)
  @ApiOperation({ summary: '获取用户的关系列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRelationships(@Request() req) {
    return this.relationshipsService.getRelationships(
      req.user.userId,
      req.user.role,
    );
  }

  @Put('relationships/:id')
  @Roles(Role.Student, Role.Parent, Role.Teacher)
  @ApiOperation({ summary: '更新关系状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateRelationship(
    @Request() req,
    @Param('id') relationshipId: string,
    @Body() updateDto: UpdateRelationshipDto,
  ) {
    return this.relationshipsService.updateRelationship(
      relationshipId,
      req.user.userId,
      updateDto,
    );
  }

  @Put('access-grants/:id')
  @Roles(Role.Student, Role.Parent, Role.Teacher)
  @ApiOperation({ summary: '更新访问授权' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateAccessGrant(
    @Request() req,
    @Param('id') grantId: string,
    @Body() updateDto: UpdateAccessGrantDto,
  ) {
    return this.relationshipsService.updateAccessGrant(
      grantId,
      req.user.userId,
      updateDto,
    );
  }

  @Delete('access-grants/:id')
  @Roles(Role.Student, Role.Parent, Role.Teacher)
  @ApiOperation({ summary: '撤销访问授权' })
  @ApiResponse({ status: 200, description: '撤销成功' })
  async revokeAccessGrant(@Request() req, @Param('id') grantId: string) {
    return this.relationshipsService.revokeAccessGrant(
      grantId,
      req.user.userId,
    );
  }

  @Get('accessible-students')
  @Roles(Role.Parent, Role.Teacher)
  @ApiOperation({ summary: '获取可访问的学生列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAccessibleStudents(@Request() req) {
    return this.relationshipsService.getAccessibleStudents(req.user.userId);
  }

  @Get('check-access/:studentId')
  @Roles(Role.Parent, Role.Teacher)
  @ApiOperation({ summary: '检查访问权限' })
  @ApiQuery({
    name: 'scope',
    description: '权限范围',
    example: 'progress:read',
  })
  @ApiResponse({ status: 200, description: '检查完成' })
  async checkAccessPermission(
    @Request() req,
    @Param('studentId') studentId: string,
    @Query('scope') scope: string,
  ) {
    const hasAccess = await this.relationshipsService.checkAccessPermission(
      req.user.userId,
      studentId,
      scope,
    );
    return { hasAccess };
  }
}
