import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ description: '班级名称', example: '初一(3)班' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '班级描述',
    example: '编程入门班级',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class JoinClassDto {
  @ApiProperty({ description: '班级邀请码', example: 'A1B2C3' })
  @IsString()
  code: string;
}

export class ApproveEnrollmentDto {
  @ApiProperty({ description: '审批决定', enum: ['approve', 'reject'] })
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';
}

export class UpdateClassDto {
  @ApiProperty({
    description: '班级名称',
    example: '初一(3)班',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '班级描述',
    example: '编程入门班级',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '班级状态',
    enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export class LeaveClassDto {
  @ApiProperty({
    description: '退出原因',
    example: '个人原因',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApproveRequestDto {
  @ApiProperty({
    description: '授权范围',
    example: ['progress:read', 'works:read'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiProperty({
    description: '过期时间',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class RejectRequestDto {
  @ApiProperty({
    description: '拒绝原因',
    example: '不同意查看',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RevokeRelationshipDto {
  @ApiProperty({
    description: '撤销原因',
    example: '不再需要',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ClassResponseDto {
  @ApiProperty({ description: '班级ID' })
  id: string;

  @ApiProperty({ description: '班级名称' })
  name: string;

  @ApiProperty({ description: '班级描述' })
  description?: string;

  @ApiProperty({ description: '邀请码' })
  code: string;

  @ApiProperty({ description: '班级状态' })
  status: string;

  @ApiProperty({ description: '学生数量' })
  studentCount: number;

  @ApiProperty({ description: '待审批数量' })
  pendingCount: number;

  @ApiProperty({ description: '邀请链接' })
  inviteUrl: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}

export class StudentClassResponseDto {
  @ApiProperty({ description: '入班记录ID' })
  id: string;

  @ApiProperty({ description: '班级信息' })
  class: {
    id: string;
    name: string;
    description?: string;
    code: string;
    teacher: {
      id: string;
      displayName: string;
      email: string;
    };
  };

  @ApiProperty({ description: '入班状态' })
  status: string;

  @ApiProperty({ description: '加入时间' })
  joinedAt: Date;
}

export class PendingEnrollmentResponseDto {
  @ApiProperty({ description: '入班申请ID' })
  id: string;

  @ApiProperty({ description: '学生信息' })
  student: {
    id: string;
    displayName: string;
    nickname?: string;
    school?: string;
    className?: string;
    email: string;
  };

  @ApiProperty({ description: '申请时间' })
  requestedAt: Date;
}

export class AuthorizationOverviewDto {
  @ApiProperty({ description: '待处理请求数量' })
  pendingRequests: number;

  @ApiProperty({ description: '活跃关系数量' })
  activeRelationships: number;

  @ApiProperty({ description: '班级数量' })
  classCount: number;

  @ApiProperty({ description: '最近活动' })
  recentActivities: Array<{
    action: string;
    timestamp: Date;
    metadata: any;
  }>;
}

export class AuditSummaryDto {
  @ApiProperty({ description: '总操作数' })
  totalActions: number;

  @ApiProperty({ description: '按类型统计的操作数' })
  actionsByType: Record<string, number>;

  @ApiProperty({ description: '最近操作' })
  recentActions: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata: any;
    ts: Date;
  }>;
}
