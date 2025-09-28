import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class JudgeRequestDto {
  @IsString()
  levelId: string;

  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  input?: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class JudgeResponseDto {
  @IsString()
  levelId: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  details?: string;

  @IsArray()
  @IsOptional()
  events?: Array<{
    type: 'on' | 'off';
    index: number;
    timestamp: number;
  }>;

  @IsString()
  @IsOptional()
  finalState?: string;

  @IsNumber()
  timeMs: number;

  @IsString()
  status: 'passed' | 'failed' | 'error';
}

export class LEDJudgeRequestDto {
  @IsString()
  levelId: string;

  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class LEDJudgeResponseDto {
  @IsString()
  levelId: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  details?: string;

  @IsArray()
  @IsOptional()
  events?: Array<{
    type: 'on' | 'off';
    index: number;
    timestamp: number;
  }>;

  @IsString()
  @IsOptional()
  finalState?: string;

  @IsNumber()
  timeMs: number;

  @IsString()
  status: 'passed' | 'failed' | 'error';
}
