import { IsString, IsOptional, IsNumber, IsArray, IsObject, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class LevelListQueryDto {
  @IsOptional()
  @IsString()
  chapter?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(['python', 'javascript'])
  lang?: string;
}

export class LevelPreviewDto {
  id: string;
  title: string;
  chapter: string;
  preview: string;
  unlocked: boolean;
  version: string;
  difficulty: number;
  gameType: string;
  rewards: {
    xp: number;
    coins: number;
    badges: string[];
  };
}

export class LevelDetailDto {
  id: string;
  title: string;
  chapter: string;
  description: string;
  starterCode: string;
  judge: {
    strategy: string;
    args?: any;
  };
  rewards: {
    xp: number;
    coins: number;
    badges: string[];
  };
  prerequisites: string[];
  next?: string;
  version: string;
  difficulty: number;
  gameType: string;
  goals: string[];
  hints: string[];
  examples: Array<{
    input: string;
    output: string;
    explain: string;
  }>;
  // 敏感字段：只有解锁后才返回
  expected?: any;
  assets?: any;
}

export class LevelListResponseDto {
  items: LevelPreviewDto[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
