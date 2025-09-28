import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateLinkRequestDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  note?: string;
}
