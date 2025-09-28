import { IsString, IsObject, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RunAndJudgeRequestDto {
  @IsString()
  code: string;

  @IsString()
  language: string;

  @IsString()
  levelId: string;

  @IsString()
  strategy: string;

  @IsObject()
  expected: any;

  @IsOptional()
  @IsObject()
  args?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => String)
  inputs?: string[];
}

export class RunAndJudgeResponseDto {
  execution: {
    stdout: string;
    stderr: string;
    exitCode: number;
    duration: number;
    events: Array<Record<string, any>>;
    artifacts: Record<string, any>;
  };

  judgment: {
    passed: boolean;
    message: string;
    details?: string;
    visualization?: any;
    metrics?: Record<string, number>;
    diff?: any;
    warnings?: string[];
  };

  rewards?: {
    xp: number;
    coins: number;
    badges: string[];
  };
}
