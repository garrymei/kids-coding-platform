import { Controller, Post, Body, HttpException, HttpStatus, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { LoggerService } from '../../common/services/logger.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService
  ) {}

  /**
   * 用户登录
   * POST /auth/login
   */
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      role: string;
      name: string;
    };
  }> {
    try {
      this.logger.info('User login attempt', {
        username: loginDto.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        cid: this.generateCorrelationId(),
      });

      const result = await this.authService.login(loginDto, req.ip);

      this.logger.info('User login successful', {
        userId: result.user.id,
        role: result.user.role,
        ip: req.ip,
      });

      return result;
    } catch (error) {
      this.logger.error('User login failed', {
        username: loginDto.username,
        error: error.message,
        ip: req.ip,
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'LOGIN_FAILED',
          message: 'Login failed',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * 用户注册
   * POST /auth/register
   */
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req: any
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      role: string;
      name: string;
    };
  }> {
    try {
      this.logger.info('User registration attempt', {
        username: registerDto.username,
        role: registerDto.role,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        cid: this.generateCorrelationId(),
      });

      const result = await this.authService.register(registerDto, req.ip);

      this.logger.info('User registration successful', {
        userId: result.user.id,
        role: result.user.role,
        ip: req.ip,
      });

      return result;
    } catch (error) {
      this.logger.error('User registration failed', {
        username: registerDto.username,
        error: error.message,
        ip: req.ip,
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'REGISTRATION_FAILED',
          message: 'Registration failed',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 刷新token
   * POST /auth/refresh
   */
  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: any
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      this.logger.info('Token refresh attempt', {
        ip: req.ip,
        cid: this.generateCorrelationId(),
      });

      const result = await this.authService.refreshToken(refreshTokenDto.refreshToken, req.ip);

      this.logger.info('Token refresh successful', {
        ip: req.ip,
      });

      return result;
    } catch (error) {
      this.logger.error('Token refresh failed', {
        error: error.message,
        ip: req.ip,
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          code: 'REFRESH_FAILED',
          message: 'Token refresh failed',
          cid: this.generateCorrelationId(),
        },
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * 用户登出
   * POST /auth/logout
   */
  @Post('logout')
  async logout(
    @Body() body: { refreshToken: string },
    @Request() req: any
  ): Promise<{ message: string }> {
    try {
      this.logger.info('User logout', {
        ip: req.ip,
        cid: this.generateCorrelationId(),
      });

      await this.authService.logout(body.refreshToken);

      this.logger.info('User logout successful', {
        ip: req.ip,
      });

      return { message: 'Logout successful' };
    } catch (error) {
      this.logger.error('User logout failed', {
        error: error.message,
        ip: req.ip,
      });

      // 登出失败不应该抛出异常，因为用户可能已经离开
      return { message: 'Logout completed' };
    }
  }

  private generateCorrelationId(): string {
    return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
