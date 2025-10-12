import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  const saltRounds = 10;
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create system user first
  const systemUser = await prisma.user.upsert({
    where: { id: 'system' },
    update: {},
    create: {
      id: 'system',
      email: 'system@internal.local',
      name: 'System',
      displayName: 'System',
      role: 'admin',
      passwordHash: passwordHash,
    } as any,
  });
  console.log(`Created system user with id: ${systemUser.id}`);

  const users = [
    {
      email: 'student@example.com',
      name: '小明同学',
      displayName: '小明同学',
      role: 'student',
      passwordHash: passwordHash,
    },
    {
      email: 'teacher@example.com',
      name: '王老师',
      displayName: '王老师',
      role: 'teacher',
      passwordHash: passwordHash,
    },
    {
      email: 'parent@example.com',
      name: '小明家长',
      displayName: '小明家长',
      role: 'parent',
      passwordHash: passwordHash,
    },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u as any,
    });
    console.log(`Created user with id: ${user.id}`);
  }

  // Seed minimal courses
  const courses = [
    { slug: 'intro-python', title: 'Python 新手村', difficulty: 'beginner' },
    { slug: 'logic-lab', title: '逻辑闯关训练营', difficulty: 'intermediate' },
  ];
  for (const c of courses) {
    await (prisma as any).course.upsert({
      where: { slug: c.slug },
      update: { title: c.title, difficulty: c.difficulty },
      create: { slug: c.slug, title: c.title, difficulty: c.difficulty },
    });
  }

  // Import levels from docs if table is empty
  const existingLevels = await (prisma as any).level.count();
  if (existingLevels === 0) {
    console.log('No levels in DB; importing from docs/levels ...');
    const levelsDir = join(process.cwd(), '..', '..', 'docs', 'levels');
    try {
      const files = await readdir(levelsDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));
      let total = 0;
      for (const file of jsonFiles) {
        try {
          const content = await readFile(join(levelsDir, file), 'utf8');
          const parsed = JSON.parse(content);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          for (const lvl of arr) {
            // basic validation
            if (!lvl || typeof lvl !== 'object' || !lvl.id || !lvl.title) {
              console.warn(`Skip invalid level in ${file}`);
              continue;
            }
            await (prisma as any).level.upsert({
              where: { id: lvl.id },
              update: {
                title: lvl.title,
                type: lvl.type,
                description: lvl.description,
                difficulty: lvl.difficulty ?? 0,
                starter: lvl.starter ?? { code: '' },
                judge: lvl.judge ??
                  lvl.grader ?? { strategy: 'manual', expected: null },
                metadata: lvl.metadata,
                pkgId: lvl.pkgId,
              },
              create: {
                id: lvl.id,
                title: lvl.title,
                type: lvl.type,
                description: lvl.description,
                difficulty: lvl.difficulty ?? 0,
                starter: lvl.starter ?? { code: '' },
                judge: lvl.judge ??
                  lvl.grader ?? { strategy: 'manual', expected: null },
                metadata: lvl.metadata,
                pkgId: lvl.pkgId,
              },
            });
            total += 1;
          }
          console.log(`Imported ${arr.length} levels from ${file}`);
        } catch (e) {
          console.error(`Failed importing ${file}:`, e);
        }
      }
      console.log(`Levels import finished. Total: ${total}`);
    } catch (e) {
      console.error('Failed to import levels from docs:', e);
    }
  } else {
    console.log(`Levels already present: ${existingLevels}`);
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
