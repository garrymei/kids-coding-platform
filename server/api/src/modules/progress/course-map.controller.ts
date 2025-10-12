import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { CurriculumService } from '../curriculum/curriculum.service';
import { ProgressService } from './progress.service';

type CourseMapNode = {
  id: string;
  title: string;
  objective?: string;
  level: number;
  language: string;
  game: string;
  passed: boolean;
  unlocked: boolean;
  status: 'passed' | 'unlocked' | 'locked';
  position: { x: number; y: number };
};

type CourseMapEdge = {
  from: string;
  to: string;
};

@Controller('course-map')
export class CourseMapController {
  constructor(
    private readonly curriculum: CurriculumService,
    private readonly progress: ProgressService,
  ) {}

  @Get(':language/:game')
  async getCourseMap(
    @Param('language') language: string,
    @Param('game') game: string,
    @Query('userId') userId = 'demo',
  ) {
    const gameJson = await this.curriculum.readGame(language, game);
    if (!gameJson) {
      throw new NotFoundException('Game not found');
    }

    const levels = Array.isArray(gameJson.levels) ? gameJson.levels : [];
    const completedNumbers = new Set(this.progress.getCompletedLevels(userId, language, game));

    const columnCount = 4;
    const xGap = 240;
    const yGap = 180;
    const offsetX = 120;

    const nodes: CourseMapNode[] = levels.map((level: any, index: number) => {
      const numericLevel =
        typeof level.level === 'number'
          ? level.level
          : Number.parseInt(level.level, 10) || index + 1;
      const nodeId = `${language}-${game}-${numericLevel}`;
      const passed = completedNumbers.has(numericLevel);

      const prerequisites: number[] =
        Array.isArray(level.prerequisites) && level.prerequisites.length > 0
          ? level.prerequisites
              .map((item: any) => (typeof item === 'number' ? item : Number.parseInt(item, 10)))
              .filter((num: number) => Number.isFinite(num))
          : numericLevel > 1
            ? [numericLevel - 1]
            : [];

      const unlocked =
        passed ||
        prerequisites.length === 0 ||
        prerequisites.every((num: number) =>
          typeof num === 'number' ? completedNumbers.has(num) : false,
        );

      const status: CourseMapNode['status'] = passed ? 'passed' : unlocked ? 'unlocked' : 'locked';

      const col = index % columnCount;
      const row = Math.floor(index / columnCount);
      const x = col * xGap + (row % 2 === 1 ? offsetX : 0);
      const y = row * yGap;

      return {
        id: nodeId,
        title: level.title ?? `Level ${numericLevel}`,
        objective: level.objective,
        level: numericLevel,
        language,
        game,
        passed,
        unlocked,
        status,
        position: { x, y },
      };
    });

    const edgesSet = new Set<string>();
    const edges: CourseMapEdge[] = [];

    nodes.forEach((node) => {
      const rawLevel = levels.find((lvl: any) => {
        const numericLevel =
          typeof lvl.level === 'number' ? lvl.level : Number.parseInt(lvl.level, 10) || null;
        return numericLevel === node.level;
      });

      let prerequisites: number[] = [];
      if (rawLevel) {
        prerequisites =
          Array.isArray(rawLevel.prerequisites) && rawLevel.prerequisites.length > 0
            ? rawLevel.prerequisites
                .map((item: any) => (typeof item === 'number' ? item : Number.parseInt(item, 10)))
                .filter((num: number) => Number.isFinite(num))
            : node.level > 1
              ? [node.level - 1]
              : [];
      }

      prerequisites.forEach((num: number) => {
        const sourceId = `${language}-${game}-${num}`;
        const edgeKey = `${sourceId}->${node.id}`;
        if (!edgesSet.has(edgeKey)) {
          edges.push({ from: sourceId, to: node.id });
          edgesSet.add(edgeKey);
        }
      });
    });

    const total = nodes.length;
    const completed = nodes.filter((node) => node.passed).length;
    const unlocked = nodes.filter((node) => node.status !== 'locked').length;

    return {
      language,
      game,
      nodes,
      edges,
      stats: {
        total,
        completed,
        unlocked,
      },
    };
  }
}
