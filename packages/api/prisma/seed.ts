import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // 创建测试用户
  const hashedPassword = await argon2.hash('password123');

  const testStudent = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      name: 'Test Student',
      displayName: 'Test Student',
      passwordHash: hashedPassword,
      role: 'student',
    },
  });

  const testAdmin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Test Admin',
      displayName: 'Test Admin',
      passwordHash: hashedPassword,
      role: 'admin',
    },
  });

  const testTeacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      name: 'Test Teacher',
      displayName: 'Test Teacher',
      passwordHash: hashedPassword,
      role: 'teacher',
    },
  });

  const testParent = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: {
      email: 'parent@example.com',
      name: 'Test Parent',
      displayName: 'Test Parent',
      passwordHash: hashedPassword,
      role: 'parent',
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seeded users:', { testStudent, testAdmin, testTeacher, testParent });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
