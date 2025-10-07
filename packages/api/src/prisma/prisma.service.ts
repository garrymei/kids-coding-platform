import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

type AsyncFn<T = any> = (...args: any[]) => Promise<T>;

interface PrismaDelegateMock {
  findUnique: AsyncFn;
  findFirst: AsyncFn;
  findMany: AsyncFn<any[]>;
  create: AsyncFn;
  createMany: AsyncFn<{ count: number }>;
  update: AsyncFn;
  updateMany: AsyncFn<{ count: number }>;
  upsert: AsyncFn;
  delete: AsyncFn;
  deleteMany: AsyncFn<{ count: number }>;
  count: AsyncFn<number>;
  groupBy: AsyncFn<any[]>;
}

function createDelegate(model: string, logger: Logger): PrismaDelegateMock {
  const log = (operation: string) => {
    logger.warn(`Prisma mock :: ${model}.${operation} invoked in mock database mode.`);
  };

  const returnInput = (args: any[]) => args?.[0]?.data ?? null;

  return {
    async findUnique(...args) {
      log('findUnique');
      return null;
    },
    async findFirst(...args) {
      log('findFirst');
      return null;
    },
    async findMany(...args) {
      log('findMany');
      return [];
    },
    async create(...args) {
      log('create');
      return returnInput(args);
    },
    async createMany(...args) {
      log('createMany');
      return { count: 0 };
    },
    async update(...args) {
      log('update');
      return returnInput(args);
    },
    async updateMany(...args) {
      log('updateMany');
      return { count: 0 };
    },
    async upsert(...args) {
      log('upsert');
      return args?.[0]?.create ?? null;
    },
    async delete(...args) {
      log('delete');
      return null;
    },
    async deleteMany(...args) {
      log('deleteMany');
      return { count: 0 };
    },
    async count(...args) {
      log('count');
      return 0;
    },
    async groupBy(...args) {
      log('groupBy');
      return [];
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

  async $connect(): Promise<void> {
    this.logger.log('PrismaService mock connect invoked.');
  }

  async $disconnect(): Promise<void> {
    this.logger.log('PrismaService mock disconnect invoked.');
  }

  async $queryRawUnsafe<T = unknown>(...params: any[]): Promise<T> {
    const [query] = params;
    this.logger.warn(`Prisma mock :: $queryRawUnsafe executed with query: ${query}`);
    return [] as T;
  }

  async $queryRaw<T = unknown>(...params: any[]): Promise<T> {
    const [query] = params;
    this.logger.warn(`Prisma mock :: $queryRaw executed with query: ${query}`);
    return [] as T;
  }
}
