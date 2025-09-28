import { IsIn, IsOptional, IsString, IsDateString } from 'class-validator';

export class TrendRequestDto {
  @IsString()
  studentId!: string;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsIn(['day', 'week'])
  @IsOptional()
  granularity?: 'day' | 'week' = 'day';
}

export interface TrendDataPoint {
  date: string;
  time_spent_min: number;
  tasks_done: number;
  accuracy: number;
  xp: number;
  streak: number;
}

export interface TrendResponse {
  studentId: string;
  series: TrendDataPoint[];
}
