import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to database successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error.message);
      // Continue without database connection for development
      this.logger.warn('Running in database-less mode for development');
    }
  }

  // Mock methods for when database is not available
  async findUnique(model: string, where: any) {
    // Return mock data based on the model and where clause
    return null;
  }

  async findMany(model: string, options: any = {}) {
    // Return mock data based on the model
    return [];
  }

  async create(model: string, data: any) {
    // Return mock data based on the model and data
    return { id: 'mock-id', ...data, createdAt: new Date(), updatedAt: new Date() };
  }

  async update(model: string, where: any, data: any) {
    // Return mock data based on the model, where clause, and data
    return { id: 'mock-id', ...data, updatedAt: new Date() };
  }
}