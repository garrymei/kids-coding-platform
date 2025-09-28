import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { ExecutionEvent } from '../eventParser';

type JudgeStrategy = 'stdout' | 'pixel' | 'music' | 'maze';

type ExecutionErrorCode = 'SYNTAX_ERROR' | 'TIMEOUT' | 'FORBIDDEN_IMPORT' | 'OUTPUT_LIMIT' | 'RUNTIME_ERROR';

export class ExecuteJudgeDto {
  @IsIn(['stdout', 'pixel', 'music', 'maze'])
  strategy!: JudgeStrategy;

  @IsObject()
  expected!: any;

  @IsOptional()
  @IsObject()
  args?: Record<string, unknown>;
}

export class ExecuteRequestDto {
  @IsIn(['python', 'javascript'])
  lang!: 'python' | 'javascript';

  @ValidateIf((o) => typeof o.code === 'string')
  @IsString()
  code?: string;

  @ValidateIf((o) => typeof o.code !== 'string')
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  stdin?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3000)
  timeoutMs?: number;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExecuteJudgeDto)
  judge?: ExecuteJudgeDto;
}

export type ExecutionError = {
  code: ExecutionErrorCode;
  message: string;
  line?: number;
  name?: string;
};

export type ExecuteResponse = {
  ok: boolean;
  stdout: string;
  stderr: string;
  timeMs: number;
  events: ExecutionEvent[];
  error: ExecutionError | null;
  judge?: {
    ok: boolean;
    details?: any;
  };
};
