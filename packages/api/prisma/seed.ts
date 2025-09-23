import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // 创建角色
  const studentRole = await prisma.role.upsert({
    where: { name: 'student' },
    update: {},
    create: { name: 'student' },
  });

  const _parentRole = await prisma.role.upsert({
    where: { name: 'parent' },
    update: {},
    create: { name: 'parent' },
  });

  const _teacherRole = await prisma.role.upsert({
    where: { name: 'teacher' },
    update: {},
    create: { name: 'teacher' },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });

  // 创建测试用户
  const hashedPassword = await argon2.hash('password123');

  const testStudent = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      displayName: 'Test Student',
      passwordHash: hashedPassword,
      roleId: studentRole.id,
    },
  });

  const testAdmin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      displayName: 'Test Admin',
      passwordHash: hashedPassword,
      roleId: adminRole.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seeded users:', { testStudent, testAdmin });
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
