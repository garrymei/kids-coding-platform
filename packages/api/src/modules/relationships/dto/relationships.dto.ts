import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
} from 'class-validator';
// import { PartyRole, RelationshipSource } from '@prisma/client';

export class RequestParentAccessDto {
  @ApiProperty({ example: 'student@example.com', description: '学生邮箱' })
  @IsEmail()
  @IsNotEmpty()
  studentEmail: string;

  @ApiProperty({ example: 'parent-view', description: '申请目的' })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({ example: '查看孩子的学习进度', description: '申请理由' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: '授权过期时间',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class RequestTeacherAccessDto {
  @ApiProperty({ example: 'student@example.com', description: '学生邮箱' })
  @IsEmail()
  @IsNotEmpty()
  studentEmail: string;

  @ApiProperty({ example: 'teacher-progress', description: '申请目的' })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({ example: '查看学生的学习进度', description: '申请理由' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: '授权过期时间',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class RespondToAccessRequestDto {
  @ApiProperty({ example: 'uuid', description: '同意书ID' })
  @IsString()
  @IsNotEmpty()
  consentId: string;

  @ApiProperty({ example: 'APPROVED', description: '响应状态' })
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @ApiProperty({
    example: ['progress:read', 'works:read'],
    description: '授权范围',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scopes?: string[];

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: '授权过期时间',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class UpdateRelationshipDto {
  @ApiProperty({ example: 'ACTIVE', description: '关系状态' })
  @IsEnum(['ACTIVE', 'INACTIVE', 'REVOKED'])
  status: 'ACTIVE' | 'INACTIVE' | 'REVOKED';
}

export class UpdateAccessGrantDto {
  @ApiProperty({ example: ['progress:read'], description: '授权范围' })
  @IsArray()
  @IsString({ each: true })
  scopes: string[];

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: '授权过期时间',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
