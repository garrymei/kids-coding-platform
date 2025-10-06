import { IsString, IsOptional, IsNumber, IsArray, IsObject, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export interface HomeProgressDto {
  xp: number;
  streakDays: number;
  today: {
    studyMinutes: number;
    attempts: number;
    passes: number;
  };
  packages: Array<{
    pkgId: string;
    title: string;
    completed: number;
    total: number;
    percent: number;
  }>;
  nextLesson?: {
    levelId: string;
    title: string;
    chapter: string;
  };
  recent: Array<{
    levelId: string;
    title: string;
    passed: boolean;
    timestamp: string;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlockedAt: string;
    icon: string;
  }>;
}

export interface PackageProgressDto {
  pkgId: string;
  levels: Array<{
    levelId: string;
    status: 'done' | 'in_progress' | 'locked';
  }>;
  completed: number;
  total: number;
  percent: number;
  ts?: number;
}

export class ProgressEventDto {
  @IsString()
  studentId: string;

  @IsString()
  levelId: string;

  @IsBoolean()
  passed: boolean;

  @IsOptional()
  @IsNumber()
  timeSpentMs?: number;

  @IsOptional()
  @IsNumber()
  attempts?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
