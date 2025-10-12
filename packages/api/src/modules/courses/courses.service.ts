import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPreview() {
    // 优先从数据库读取；数据库为空时回退到内置示例
    const rows = await (this.prisma as any).course.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    if (rows.length > 0) {
      return rows.map((c) => ({
        id: c.slug,
        title: c.title,
        difficulty: c.difficulty ?? 'beginner',
      }));
    }
    return [
      { id: 'intro-python', title: 'Python 新手村', difficulty: 'beginner' },
      { id: 'logic-lab', title: '逻辑闯关训练营', difficulty: 'intermediate' },
    ];
  }

  async getCourseMap(slug: string) {
    // 简易映射策略：
    // - intro-python: 选取 id 以 'py-' 开头的关卡
    // - logic-lab: 选取难度 <= 3 的关卡
    // 数据优先来自数据库，若为空则回退到内置样例
    const allLevels = await (this.prisma as any).level
      .findMany({
        orderBy: [{ difficulty: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          type: true,
          metadata: true,
        },
      })
      .catch(() => []);

    const filterBySlug = (levels: any[]) => {
      if (slug === 'intro-python') {
        return levels.filter(
          (l) => typeof l.id === 'string' && l.id.startsWith('py-'),
        );
      }
      if (slug === 'logic-lab') {
        return levels.filter((l) => (l.difficulty ?? 0) <= 3);
      }
      // 未知课程：返回空数组
      return [];
    };

    const selected = filterBySlug(allLevels);

    // Fallback 到内置样例（若数据库没有对应数据）
    const result = {
      course: {
        slug,
        title:
          slug === 'intro-python'
            ? 'Python 新手村'
            : slug === 'logic-lab'
              ? '逻辑闯关训练营'
              : slug,
      },
      levels: selected.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        difficulty: l.difficulty ?? 0,
        type: l.type ?? 'game',
        metadata: l.metadata ?? undefined,
      })),
      total: selected.length,
    };

    return result;
  }
}
