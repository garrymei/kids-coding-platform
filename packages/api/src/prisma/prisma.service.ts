import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

type PrismaDelegate = {
  findUnique: (...args: any[]) => Promise<any>;
  findFirst: (...args: any[]) => Promise<any>;
  findMany: (...args: any[]) => Promise<any[]>;
  create: (...args: any[]) => Promise<any>;
  update: (...args: any[]) => Promise<any>;
  updateMany: (...args: any[]) => Promise<{ count: number }>;
  createMany: (...args: any[]) => Promise<{ count: number }>;
  delete: (...args: any[]) => Promise<any>;
  deleteMany: (...args: any[]) => Promise<{ count: number }>;
  count: (...args: any[]) => Promise<number>;
};

function createDelegate(model: string, logger: Logger): PrismaDelegate {
  const log = (operation: string) =>
    logger.warn([Prisma mock] . invoked in mock database mode.);

  return {
    async findUnique(...args: any[]) {
      log('findUnique');
      return null;
    },
    async findFirst(...args: any[]) {
      log('findFirst');
      return null;
    },
    async findMany(...args: any[]) {
      log('findMany');
      return [];
    },
    async create(...args: any[]) {
      log('create');
      return args[0]?.data ?? null;
    },
    async update(...args: any[]) {
      log('update');
      return args[0]?.data ?? null;
    },
    async updateMany(...args: any[]) {
      log('updateMany');
      return { count: 0 };
    },
    async createMany(...args: any[]) {
      log('createMany');
      return { count: 0 };
    },
    async delete(...args: any[]) {
      log('delete');
      return null;
    },
    async deleteMany(...args: any[]) {
      log('deleteMany');
      return { count: 0 };
    },
    async count(...args: any[]) {
      log('count');
      return 0;
    },
  };
}

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  user = createDelegate('user', this.logger);
  class = createDelegate('class', this.logger);
  classEnrollment = createDelegate('classEnrollment', this.logger);
  auditLog = createDelegate('auditLog', this.logger);
  relationship = createDelegate('relationship', this.logger);
  accessGrant = createDelegate('accessGrant', this.logger);
  consent = createDelegate('consent', this.logger);
  parentLinkRequest = createDelegate('parentLinkRequest', this.logger);
  metricsSnapshot = createDelegate('metricsSnapshot', this.logger);
  dailyStat = createDelegate('dailyStat', this.logger);
  learnEvent = createDelegate('learnEvent', this.logger);

  async onModuleInit(): Promise<void> {
    this.logger.warn('PrismaService is running in mock mode. No database connection will be established.');
  }

  async (): Promise<void> {
    this.logger.log('PrismaService mock connect invoked');
  }

  async (): Promise<void> {
    this.logger.log('PrismaService mock disconnect invoked');
  }

  async <T = unknown>(query: string): Promise<T[]> {
    this.logger.warn([Prisma mock]  executed with query: );
    return [];
  }

  async <T = unknown>(query: string): Promise<T[]> {
    this.logger.warn([Prisma mock]  executed with query: );
    return [];
  }
}