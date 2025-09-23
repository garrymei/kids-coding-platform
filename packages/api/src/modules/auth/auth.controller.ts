import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AuthService, AuthToken } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return JWT' })
  @ApiOkResponse({ description: 'JWT access token issued.' })
  async login(@Body() dto: LoginDto): Promise<AuthToken> {
    return this.authService.login(dto.email, dto.password);
  }
}
