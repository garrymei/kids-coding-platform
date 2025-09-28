import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ParentsService } from './parents.service';
import { CreateLinkRequestDto } from './dto/link-request.dto';
import { GetLinkRequestsDto } from './dto/get-link-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('parents')
@UseGuards(JwtAuthGuard)
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get('discover-students')
  discoverStudents(@Query('q') query: string) {
    return this.parentsService.discoverStudents(query);
  }

  @Post('link-requests')
  createLinkRequest(@Body() createLinkRequestDto: CreateLinkRequestDto, @Request() req) {
    const parentId = req.user.id;
    return this.parentsService.createLinkRequest(createLinkRequestDto, parentId);
  }

  @Get('link-requests')
  getLinkRequests(@Query() getLinkRequestsDto: GetLinkRequestsDto, @Request() req) {
    const parentId = req.user.id;
    return this.parentsService.getLinkRequests(parentId, getLinkRequestsDto.status);
  }
}
