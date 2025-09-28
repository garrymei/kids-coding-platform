import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class JudgeRequestDto {
  @IsString()
  levelId!: string;

  @IsIn(['io', 'led', 'maze', 'pixel', 'music', 'open'])
  gameType!: 'io' | 'led' | 'maze' | 'pixel' | 'music' | 'open';

  /** 来自关卡配置的期望（不同模式结构不同） */
  @IsObject()
  expected!: any;

  /** 学生提交得到的实际结果：stdout / events 等 */
  @IsObject()
  actual!: any;

  /** 可选：结构约束（如 requireStructures:['for']） */
  @IsArray()
  @IsOptional()
  requireStructures?: string[];
}

export type JudgeResult = {
  ok: boolean;
  score: number;      // 1~3 星
  stars: number;
  details?: any;
  rewards?: { xp: number; coins: number; badges?: string[] };
};