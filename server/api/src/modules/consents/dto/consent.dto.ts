import { IsString, IsOptional, IsIn, IsObject } from 'class-validator';

export class ConsentActionDto {
  @IsString()
  requestId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ConsentResponseDto {
  id!: string;
  status!: 'pending' | 'approved' | 'rejected' | 'revoked';
  decidedAt!: string;
  reason?: string;
  studentId!: string;
  parentId!: string;
  createdAt!: string;
  updatedAt!: string;
}

export class ConsentRequestDto {
  @IsString()
  studentId!: string;

  @IsString()
  parentId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ConsentListQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'rejected', 'revoked'])
  status?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
