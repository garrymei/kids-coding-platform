import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../auth/roles.enum';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        include: { role: true },
      });
    } catch (error) {
      // In development mode, provide mock user data if database is not available
      if (process.env.NODE_ENV !== 'production') {
        // Mock user data for development
        const mockUsers = {
          '1': {
            id: '1',
            email: 'parent@example.com',
            displayName: 'Parent User',
            role: { name: Role.Parent },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          '2': {
            id: '2',
            email: 'teacher@example.com',
            displayName: 'Teacher User',
            role: { name: Role.Teacher },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          '3': {
            id: '3',
            email: 'admin@example.com',
            displayName: 'Admin User',
            role: { name: Role.Admin },
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        };

        return mockUsers[id] || null;
      }
      
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany({
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      // In development mode, provide mock user data if database is not available
      if (process.env.NODE_ENV !== 'production') {
        // Mock user data for development
        return [
          {
            id: '1',
            email: 'parent@example.com',
            displayName: 'Parent User',
            role: { name: Role.Parent },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            email: 'teacher@example.com',
            displayName: 'Teacher User',
            role: { name: Role.Teacher },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '3',
            email: 'admin@example.com',
            displayName: 'Admin User',
            role: { name: Role.Admin },
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        ];
      }
      
      throw error;
    }
  }
}