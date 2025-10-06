import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LevelsService, Level } from './levels.service';

@ApiTags('levels')
@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有关卡' })
  @ApiResponse({ status: 200, description: '成功获取关卡列表', type: [Object] })
  async getAllLevels(): Promise<Level[]> {
    try {
      return await this.levelsService.getAllLevels();
    } catch (error) {
      throw new HttpException(
        'Failed to load levels',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取关卡' })
  @ApiParam({ name: 'id', description: '关卡ID' })
  @ApiResponse({ status: 200, description: '成功获取关卡', type: Object })
  @ApiResponse({ status: 404, description: '关卡不存在' })
  async getLevelById(@Param('id') id: string): Promise<Level> {
    try {
      return await this.levelsService.getLevelById(id);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException('Level not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to load level',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('type/:type')
  @ApiOperation({ summary: '根据类型获取关卡' })
  @ApiParam({
    name: 'type',
    description: '关卡类型',
    enum: ['pixel', 'music', 'animation', 'game'],
  })
  @ApiResponse({ status: 200, description: '成功获取关卡列表', type: [Object] })
  async getLevelsByType(@Param('type') type: string): Promise<Level[]> {
    try {
      return await this.levelsService.getLevelsByType(type);
    } catch (error) {
      throw new HttpException(
        'Failed to load levels by type',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search')
  @ApiOperation({ summary: '搜索关卡' })
  @ApiQuery({ name: 'q', description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '成功搜索关卡', type: [Object] })
  async searchLevels(@Query('q') query: string): Promise<Level[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      return await this.levelsService.searchLevels(query);
    } catch (error) {
      throw new HttpException(
        'Failed to search levels',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
