import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class StudentTrendQueryDto {
  @ApiProperty({
    description: '开始日期',
    example: '2024-01-01',
  })
  @IsDateString()
  from: string;

  @ApiProperty({
    description: '结束日期',
    example: '2024-01-31',
  })
  @IsDateString()
  to: string;

  @ApiProperty({
    description: '数据粒度',
    enum: ['day', 'week'],
    required: false,
    default: 'day',
  })
  @IsOptional()
  @IsEnum(['day', 'week'])
  granularity?: 'day' | 'week' = 'day';
}

export class ComparisonRequestDto {
  @ApiProperty({
    description: '学生ID列表',
    example: ['student-1', 'student-2', 'student-3'],
  })
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];

  @ApiProperty({
    description: '要对比的指标',
    example: ['accuracy', 'tasks_done', 'time_spent_min'],
    enum: [
      'accuracy',
      'tasks_done',
      'time_spent_min',
      'xp_gained',
      'streak_days',
    ],
  })
  @IsArray()
  @IsEnum(
    ['accuracy', 'tasks_done', 'time_spent_min', 'xp_gained', 'streak_days'],
    {
      each: true,
    },
  )
  metrics: string[];

  @ApiProperty({
    description: '时间窗口',
    example: 'last_14d',
    enum: ['last_7d', 'last_14d', 'last_30d', 'last_90d'],
  })
  @IsEnum(['last_7d', 'last_14d', 'last_30d', 'last_90d'])
  window: string;
}

export class StudentTrendResponseDto {
  @ApiProperty({ description: '日期' })
  date: string;

  @ApiProperty({ description: '学习时长（分钟）' })
  time_spent_min: number;

  @ApiProperty({ description: '完成任务数' })
  tasks_done: number;

  @ApiProperty({ description: '准确率' })
  accuracy: number;

  @ApiProperty({ description: '获得经验值' })
  xp: number;

  @ApiProperty({ description: '连续学习天数' })
  streak: number;
}

export class StudentComparisonResponseDto {
  @ApiProperty({ description: '学生ID' })
  studentId: string;

  @ApiProperty({ description: '学生姓名', required: false })
  studentName?: string;

  @ApiProperty({ description: '准确率' })
  accuracy: number;

  @ApiProperty({ description: '完成任务数' })
  tasks_done: number;

  @ApiProperty({ description: '学习时长（分钟）' })
  time_spent_min: number;

  @ApiProperty({ description: '综合排名' })
  rank: number;

  @ApiProperty({ description: '是否为匿名数据', required: false })
  isAnonymous?: boolean;
}

export class StudentSummaryResponseDto {
  @ApiProperty({ description: '学生ID' })
  studentId: string;

  @ApiProperty({ description: '学生姓名' })
  studentName: string;

  @ApiProperty({ description: '总学习时长（分钟）' })
  totalTimeSpent: number;

  @ApiProperty({ description: '总完成任务数' })
  totalTasksDone: number;

  @ApiProperty({ description: '平均准确率' })
  averageAccuracy: number;

  @ApiProperty({ description: '总经验值' })
  totalXP: number;

  @ApiProperty({ description: '当前连续学习天数' })
  currentStreak: number;

  @ApiProperty({ description: '最后活跃日期', required: false })
  lastActiveDate?: string;
}

export class ClassOverviewResponseDto {
  @ApiProperty({ description: '班级ID' })
  classId: string;

  @ApiProperty({ description: '班级名称' })
  className: string;

  @ApiProperty({ description: '学生数量' })
  studentCount: number;

  @ApiProperty({ description: '班级平均准确率' })
  averageAccuracy: number;

  @ApiProperty({ description: '班级总完成任务数' })
  totalTasksDone: number;

  @ApiProperty({ description: '班级总学习时长（分钟）' })
  totalTimeSpent: number;

  @ApiProperty({
    description: '表现最佳的学生',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        studentName: { type: 'string' },
        accuracy: { type: 'number' },
        tasksDone: { type: 'number' },
      },
    },
  })
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    accuracy: number;
    tasksDone: number;
  }>;
}
