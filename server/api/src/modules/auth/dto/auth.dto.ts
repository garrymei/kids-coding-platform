import { IsString, IsEmail, IsIn, MinLength, MaxLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @IsIn(['student', 'parent', 'teacher'])
  role!: 'student' | 'parent' | 'teacher';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  inviteCode?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  newPassword!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;
}

export class VerifyResetTokenDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  newPassword!: string;
}
