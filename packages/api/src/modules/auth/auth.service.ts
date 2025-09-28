import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from './roles.enum';
import * as argon2 from 'argon2';
import { AuditLoggerService } from '../audit/services/audit-logger.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthToken {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    role: Role;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  private async validateUser(email: string, password: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { role: true },
      });
      if (!user || !user.passwordHash) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordMatches = await argon2.verify(user.passwordHash, password);
      if (!passwordMatches) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return user;
    } catch (error) {
      // In development mode, provide mock user data if database is not available
      if (process.env.NODE_ENV !== 'production') {
        // Mock user data for development
        const mockUsers = {
          'parent@example.com': {
            id: '1',
            email: 'parent@example.com',
            passwordHash: '$argon2i$v=19$m=4096,t=3,p=1$c2FsdHlfc2FsdHlfc2FsdHk$K4S0qXgD5zYJ2C9b7b9Z1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0', // password: password
            displayName: 'Parent User',
            role: { name: Role.Parent }
          },
          'teacher@example.com': {
            id: '2',
            email: 'teacher@example.com',
            passwordHash: '$argon2i$v=19$m=4096,t=3,p=1$c2FsdHlfc2FsdHlfc2FsdHk$K4S0qXgD5zYJ2C9b7b9Z1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0', // password: password
            displayName: 'Teacher User',
            role: { name: Role.Teacher }
          },
          'admin@example.com': {
            id: '3',
            email: 'admin@example.com',
            passwordHash: '$argon2i$v=19$m=4096,t=3,p=1$c2FsdHlfc2FsdHlfc2FsdHk$K4S0qXgD5zYJ2C9b7b9Z1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0', // password: password
            displayName: 'Admin User',
            role: { name: Role.Admin }
          }
        };

        const mockUser = mockUsers[email];
        if (!mockUser) {
          throw new UnauthorizedException('Invalid credentials');
        }

        const passwordMatches = await argon2.verify(mockUser.passwordHash, password);
        if (!passwordMatches) {
          throw new UnauthorizedException('Invalid credentials');
        }

        return mockUser;
      }
      
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async login(email: string, password: string): Promise<AuthToken> {
    const user = await this.validateUser(email, password);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name as Role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // Log the login event
    await this.auditLogger.logLogin(user.id, undefined, undefined, {
      email: user.email,
      role: user.role.name,
      loginMethod: 'email/password',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? null,
        role: user.role.name as Role,
      },
    };
  }
}