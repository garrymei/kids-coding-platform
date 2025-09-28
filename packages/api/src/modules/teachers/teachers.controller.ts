import { Controller, Post, Body, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('teachers')
@UseGuards(JwtAuthGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post('classes')
  createClass(@Body() createClassDto: CreateClassDto, @Request() req) {
    const teacherId = req.user.id;
    return this.teachersService.createClass(createClassDto, teacherId);
  }

  @Get('classes/:classId/approvals')
  getApprovals(
    @Param('classId') classId: string,
    @Query('status') status: string,
    @Request() req,
  ) {
    const teacherId = req.user.id;
    return this.teachersService.getApprovals(classId, teacherId, status);
  }

  @Post('classes/:classId/approvals/:memberId/approve')
  approveApproval(
    @Param('classId') classId: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    const teacherId = req.user.id;
    return this.teachersService.approveApproval(classId, memberId, teacherId);
  }

  @Post('classes/:classId/approvals/:memberId/reject')
  rejectApproval(
    @Param('classId') classId: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    const teacherId = req.user.id;
    return this.teachersService.rejectApproval(classId, memberId, teacherId);
  }
}
