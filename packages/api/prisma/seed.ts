import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  const saltRounds = 10;
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const users = [
    {
      email: 'student@example.com',
      name: '小明同学',
      role: Role.student,
      passwordHash: passwordHash,
    },
    {
      email: 'teacher@example.com',
      name: '王老师',
      role: Role.teacher,
      passwordHash: passwordHash,
    },
    {
      email: 'parent@example.com',
      name: '小明家长',
      role: Role.parent,
      passwordHash: passwordHash,
    },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    console.log(`Created user with id: ${user.id}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });