import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class ComparisonRequestDto {
  @IsArray()
  @IsString({ each: true })
  studentIds!: string[];

  @IsArray()
  @IsIn(['accuracy', 'tasks_done', 'time_spent_min', 'xp', 'streak'], { each: true })
  metrics!: string[];

  @IsIn(['last_7d', 'last_14d', 'last_30d', 'last_90d'])
  @IsOptional()
  window?: string = 'last_14d';

  @IsString()
  @IsOptional()
  classId?: string;
}

export interface ComparisonItem {
  studentId: string;
  accuracy: number;
  tasks_done: number;
  time_spent_min: number;
  xp: number;
  streak: number;
  rank: number;
  isAnonymous?: boolean;
}

export interface ClassPercentiles {
  p50: Record<string, number>;
  p90: Record<string, number>;
}

export interface ComparisonResponse {
  window: string;
  items: ComparisonItem[];
  class_percentiles: ClassPercentiles;
}
