import { 
  Controller, 
  Get, 
  Query, 
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions, Permission } from '../../auth/decorators/permissions.decorator';
import { SearchStrategyService, SearchResult } from '../services/search-strategy.service';
import { RateLimitService } from '../services/rate-limit.service';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('search')
@Controller('relationships/search-students')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(
    private readonly searchStrategyService: SearchStrategyService,
    private readonly rateLimitService: RateLimitService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermissions(Permission.REQUEST_STUDENT_ACCESS)
  @ApiOperation({ summary: '搜索学生' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  @ApiQuery({ name: 'q', description: '搜索关键词（昵称或匿名ID）', required: true })
  @ApiQuery({ name: 'school', description: '学校名称（可选）', required: false })
  @ApiQuery({ name: 'class', description: '班级名称（可选）', required: false })
  async searchStudents(
    @Request() req,
    @Query('q') keyword: string,
    @Query('school') school?: string,
    @Query('class') className?: string,
  ) {
    const searcherId = req.user.userId;
    const searcherIp = req.ip || req.connection.remoteAddress;

    // 验证搜索关键词
    if (!keyword || keyword.trim().length < 2) {
      throw new BadRequestException('搜索关键词至少需要2个字符');
    }

    // 检查速率限制
    await this.rateLimitService.checkSearchRateLimit(searcherId, 'user');
    if (searcherIp) {
      await this.rateLimitService.checkSearchRateLimit(searcherIp, 'ip');
    }

    // 判断搜索类型
    const searchType = keyword.startsWith('S-') ? 'anonymous_id' : 'nickname';
    
    // 构建搜索条件
    const where: any = {
      role: 'student',
      discoverable: true, // 只搜索可被发现的学生
    };

    if (searchType === 'anonymous_id') {
      // 通过匿名ID搜索
      where.anonymousId = keyword;
    } else {
      // 通过昵称搜索
      where.nickname = {
        contains: keyword,
        mode: 'insensitive',
      };
    }

    if (school) {
      where.school = {
        contains: school,
        mode: 'insensitive',
      };
    }

    if (className) {
      where.className = {
        contains: className,
        mode: 'insensitive',
      };
    }

    // 执行搜索
    const students = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        nickname: true,
        school: true,
        className: true,
        discoverable: true,
        // 这里需要添加anonymousId和searchVisibility字段
        // anonymousId: true,
        // searchVisibility: true,
      },
      take: 20, // 限制搜索结果数量
    });

    // 过滤结果（排除已建立关系的学生）
    const filteredStudents = [];
    for (const student of students) {
      const hasPermission = await this.searchStrategyService.checkSearchPermission(
        searcherId,
        student.id,
        searchType
      );
      
      if (hasPermission) {
        filteredStudents.push(student);
      }
    }

    // 应用去标识化处理
    const searchResults = await this.searchStrategyService.filterSearchResults(
      filteredStudents,
      searcherId,
      searchType
    );

    // 记录搜索审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: searcherId,
        action: 'search_students',
        targetType: 'search',
        targetId: 'students',
        metadata: {
          keyword,
          school,
          className,
          searchType,
          resultCount: searchResults.length,
          ip: searcherIp,
        },
      },
    });

    return {
      results: searchResults,
      total: searchResults.length,
      searchType,
      keyword,
      filters: {
        school,
        className,
      },
    };
  }

  @Get('rate-limit-status')
  @RequirePermissions(Permission.REQUEST_STUDENT_ACCESS)
  @ApiOperation({ summary: '获取搜索速率限制状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRateLimitStatus(@Request() req) {
    const userId = req.user.userId;
    const userIp = req.ip || req.connection.remoteAddress;

    const [searchStatus, requestStatus] = await Promise.all([
      this.rateLimitService.getRateLimitStatus(userId, 'user', 'search'),
      this.rateLimitService.getRateLimitStatus(userId, 'user', 'request'),
    ]);

    return {
      search: searchStatus,
      request: requestStatus,
      ip: userIp,
    };
  }

  @Get('search-settings')
  @RequirePermissions(Permission.MANAGE_OWN_VISIBILITY)
  @ApiOperation({ summary: '获取搜索设置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSearchSettings(@Request() req) {
    const studentId = req.user.userId;

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        nickname: true,
        school: true,
        className: true,
        discoverable: true,
        // 这里需要添加相关字段
        // anonymousId: true,
        // searchVisibility: true,
      },
    });

    if (!student) {
      throw new BadRequestException('学生不存在');
    }

    return {
      id: student.id,
      nickname: student.nickname,
      school: student.school,
      className: student.className,
      discoverable: student.discoverable,
      // anonymousId: student.anonymousId,
      // searchVisibility: student.searchVisibility || 'private',
      // 临时返回默认值
      anonymousId: null,
      searchVisibility: 'private',
    };
  }

  @Get('visibility-warning')
  @RequirePermissions(Permission.MANAGE_OWN_VISIBILITY)
  @ApiOperation({ summary: '获取公开搜索警告信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getVisibilityWarning() {
    return this.searchStrategyService.getPublicVisibilityWarning();
  }
}
