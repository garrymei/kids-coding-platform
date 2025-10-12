import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateSearchabilityDto {
  @ApiProperty({ example: true, description: '是否允许被搜索' })
  @IsBoolean()
  isSearchable: boolean;

  @ApiProperty({ example: '小明', description: '搜索昵称', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(20)
  searchNickname?: string;

  @ApiProperty({
    example: '北京市第一中学',
    description: '学校名称',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  schoolName?: string;

  @ApiProperty({
    example: '初一(3)班',
    description: '班级名称',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  className?: string;
}

export class SearchStudentDto {
  @ApiProperty({ example: '小明', description: '学生昵称' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;

  @ApiProperty({
    example: '北京市第一中学',
    description: '学校名称',
    required: false,
  })
  @IsString()
  @IsOptional()
  schoolName?: string;

  @ApiProperty({
    example: '初一(3)班',
    description: '班级名称',
    required: false,
  })
  @IsString()
  @IsOptional()
  className?: string;
}

export class CreateFollowRequestDto {
  @ApiProperty({ example: 'student123', description: '学生匿名ID' })
  @IsString()
  studentAnonymousId: string;

  @ApiProperty({ example: 'parent-view', description: '关注目的' })
  @IsString()
  purpose: string;

  @ApiProperty({
    example: '我是孩子的家长，想了解学习情况',
    description: '申请理由',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  reason: string;

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: '授权过期时间',
    required: false,
  })
  @IsString()
  @IsOptional()
  expiresAt?: string;
}

export class GenerateShareCodeDto {
  @ApiProperty({ example: 'parent-view', description: '分享目的' })
  @IsString()
  purpose: string;

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: '过期时间',
    required: false,
  })
  @IsString()
  @IsOptional()
  expiresAt?: string;
}
