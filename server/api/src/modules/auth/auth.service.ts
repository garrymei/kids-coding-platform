import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';
import { JwtService } from '../../middleware/auth.middleware';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'student' | 'parent' | 'teacher' | 'admin';
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

interface RefreshToken {
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

@Injectable()
export class AuthService {
  private users: Map<string, User> = new Map();
  private refreshTokens: Map<string, RefreshToken> = new Map();
  private readonly jwtService: JwtService;
  private readonly saltRounds = 12;

  constructor(private readonly logger: LoggerService) {
    this.jwtService = new JwtService();
    this.initializeMockUsers();
  }

  /**
   * 初始化模拟用户数据
   */
  private initializeMockUsers(): void {
    const mockUsers: User[] = [
      {
        id: 'stu_1',
        username: 'student1',
        email: 'student1@example.com',
        name: '小明',
        role: 'student',
        passwordHash: this.hashPassword('password123'),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'parent_1',
        username: 'parent1',
        email: 'parent1@example.com',
        name: '张妈妈',
        role: 'parent',
        passwordHash: this.hashPassword('password123'),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'teacher_1',
        username: 'teacher1',
        email: 'teacher1@example.com',
        name: '李老师',
        role: 'teacher',
        passwordHash: this.hashPassword('password123'),
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ];

    for (const user of mockUsers) {
      this.users.set(user.id, user);
    }
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto, ip: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      role: string;
      name: string;
    };
  }> {
    // 查找用户
    const user = Array.from(this.users.values()).find(
      u => u.username === loginDto.username || u.email === loginDto.username
    );

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password',
        cid: this.generateCorrelationId(),
      });
    }

    // 检查用户状态
    if (!user.isActive) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DISABLED',
        message: 'Account is disabled',
        cid: this.generateCorrelationId(),
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password',
        cid: this.generateCorrelationId(),
      });
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date().toISOString();
    this.users.set(user.id, user);

    // 生成tokens
    const accessToken = this.jwtService.generateToken({
      userId: user.id,
      role: user.role,
    });

    const refreshToken = this.jwtService.generateRefreshToken({
      userId: user.id,
      role: user.role,
    });

    // 存储刷新token
    this.refreshTokens.set(refreshToken, {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天
      createdAt: new Date().toISOString(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
      },
    };
  }

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto, ip: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      role: string;
      name: string;
    };
  }> {
    // 检查用户名是否已存在
    const existingUser = Array.from(this.users.values()).find(
      u => u.username === registerDto.username || u.email === registerDto.email
    );

    if (existingUser) {
      throw new ConflictException({
        code: 'USER_EXISTS',
        message: 'Username or email already exists',
        cid: this.generateCorrelationId(),
      });
    }

    // 验证邀请码（如果需要）
    if (registerDto.role === 'teacher' && registerDto.inviteCode) {
      const isValidInviteCode = await this.validateInviteCode(registerDto.inviteCode);
      if (!isValidInviteCode) {
        throw new BadRequestException({
          code: 'INVALID_INVITE_CODE',
          message: 'Invalid invite code',
          cid: this.generateCorrelationId(),
        });
      }
    }

    // 创建新用户
    const userId = this.generateUserId(registerDto.role);
    const newUser: User = {
      id: userId,
      username: registerDto.username,
      email: registerDto.email,
      name: registerDto.name,
      role: registerDto.role,
      passwordHash: this.hashPassword(registerDto.password),
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    this.users.set(userId, newUser);

    // 生成tokens
    const accessToken = this.jwtService.generateToken({
      userId: newUser.id,
      role: newUser.role,
    });

    const refreshToken = this.jwtService.generateRefreshToken({
      userId: newUser.id,
      role: newUser.role,
    });

    // 存储刷新token
    this.refreshTokens.set(refreshToken, {
      token: refreshToken,
      userId: newUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        role: newUser.role,
        name: newUser.name,
      },
    };
  }

  /**
   * 刷新token
   */
  async refreshToken(refreshToken: string, ip: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const tokenData = this.refreshTokens.get(refreshToken);
    
    if (!tokenData) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token',
        cid: this.generateCorrelationId(),
      });
    }

    // 检查token是否过期
    if (new Date() > new Date(tokenData.expiresAt)) {
      this.refreshTokens.delete(refreshToken);
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired',
        cid: this.generateCorrelationId(),
      });
    }

    // 获取用户信息
    const user = this.users.get(tokenData.userId);
    if (!user || !user.isActive) {
      this.refreshTokens.delete(refreshToken);
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'User not found or inactive',
        cid: this.generateCorrelationId(),
      });
    }

    // 删除旧的刷新token
    this.refreshTokens.delete(refreshToken);

    // 生成新的tokens
    const newAccessToken = this.jwtService.generateToken({
      userId: user.id,
      role: user.role,
    });

    const newRefreshToken = this.jwtService.generateRefreshToken({
      userId: user.id,
      role: user.role,
    });

    // 存储新的刷新token
    this.refreshTokens.set(newRefreshToken, {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * 用户登出
   */
  async logout(refreshToken: string): Promise<void> {
    this.refreshTokens.delete(refreshToken);
  }

  /**
   * 验证用户权限
   */
  async validateUser(userId: string, requiredRole?: string): Promise<User | null> {
    const user = this.users.get(userId);
    
    if (!user || !user.isActive) {
      return null;
    }

    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
      return null;
    }

    return user;
  }

  /**
   * 获取用户信息
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, this.saltRounds);
  }

  private generateUserId(role: string): string {
    const prefix = role === 'student' ? 'stu' : role === 'parent' ? 'parent' : 'teacher';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}_${timestamp}_${random}`;
  }

  private async validateInviteCode(inviteCode: string): Promise<boolean> {
    // 这里应该验证邀请码的有效性
    // 暂时返回true用于演示
    return inviteCode === 'TEACHER_INVITE_2024';
  }

  private generateCorrelationId(): string {
    return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
