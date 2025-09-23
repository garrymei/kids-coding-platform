import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: 'Python 编程入门班', description: '班级名称' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '适合初学者的 Python 编程课程', description: '班级描述', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

export class UpdateClassDto {
  @ApiProperty({ example: 'Python 编程进阶班', description: '班级名称', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: '适合有基础的学生', description: '班级描述', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

export class JoinClassDto {
  @ApiProperty({ example: 'ABC123', description: '班级邀请码' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  inviteCode: string;
}

export class ApproveEnrollmentDto {
  @ApiProperty({ example: 'uuid', description: '注册记录ID' })
  @IsString()
  @IsNotEmpty()
  enrollmentId: string;
}

export class RejectEnrollmentDto {
  @ApiProperty({ example: 'uuid', description: '注册记录ID' })
  @IsString()
  @IsNotEmpty()
  enrollmentId: string;
}
