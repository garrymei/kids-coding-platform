import { PixelStrategy } from './pixel.strategy';
import { JudgeInput } from './judge-strategy.interface';

describe('PixelStrategy', () => {
  let strategy: PixelStrategy;

  beforeEach(() => {
    strategy = new PixelStrategy();
  });

  describe('完全匹配', () => {
    it('应该通过完全匹配的像素矩阵', () => {
      const expected = {
        width: 3,
        height: 3,
        pixels: [
          [0, 0, 0],
          [0, 1, 0],
          [0, 0, 0],
        ],
      };

      const input: JudgeInput = {
        strategy: 'pixel',
        expected,
        output: {
          artifacts: {
            pixelMatrix: expected,
          },
        },
        args: {
          similarityThreshold: 0.95,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true);
      expect(result.metrics?.similarity).toBe(1);
      expect(result.metrics?.diffCount).toBe(0);
    });
  });

  describe('容差匹配', () => {
    it('应该在容差范围内通过', () => {
      const expected = {
        width: 2,
        height: 2,
        pixels: [
          [100, 200],
          [150, 250],
        ],
      };

      const actual = {
        width: 2,
        height: 2,
        pixels: [
          [102, 198], // 在容差范围内
          [148, 252], // 在容差范围内
        ],
      };

      const input: JudgeInput = {
        strategy: 'pixel',
        expected,
        output: {
          artifacts: {
            pixelMatrix: actual,
          },
        },
        args: {
          tolerance: 5,
          similarityThreshold: 0.95,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true);
      expect(result.metrics?.similarity).toBe(1);
    });

    it('应该拒绝超出容差的像素', () => {
      const expected = {
        width: 2,
        height: 2,
        pixels: [
          [100, 200],
          [150, 250],
        ],
      };

      const actual = {
        width: 2,
        height: 2,
        pixels: [
          [110, 190], // 超出容差
          [140, 260], // 超出容差
        ],
      };

      const input: JudgeInput = {
        strategy: 'pixel',
        expected,
        output: {
          artifacts: {
            pixelMatrix: actual,
          },
        },
        args: {
          tolerance: 5,
          similarityThreshold: 0.95,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(false);
      expect(result.metrics?.similarity).toBe(0);
      expect(result.metrics?.diffCount).toBe(4);
    });
  });

  describe('尺寸不匹配', () => {
    it('应该拒绝尺寸不匹配的矩阵', () => {
      const expected = {
        width: 2,
        height: 2,
        pixels: [
          [0, 0],
          [0, 0],
        ],
      };

      const actual = {
        width: 3,
        height: 3,
        pixels: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
      };

      const input: JudgeInput = {
        strategy: 'pixel',
        expected,
        output: {
          artifacts: {
            pixelMatrix: actual,
          },
        },
        args: {
          allowScale: false,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Dimension mismatch');
    });

    it('应该允许缩放当启用时', () => {
      const expected = {
        width: 2,
        height: 2,
        pixels: [
          [0, 0],
          [0, 1],
        ],
      };

      const actual = {
        width: 4,
        height: 4,
        pixels: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 1],
        ],
      };

      const input: JudgeInput = {
        strategy: 'pixel',
        expected,
        output: {
          artifacts: {
            pixelMatrix: actual,
          },
        },
        args: {
          allowScale: true,
          similarityThreshold: 0.95,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true);
      expect(result.warnings).toContain('Scaled actual matrix from 4x4 to 2x2');
    });
  });

  describe('从事件解析', () => {
    it('应该从像素事件构建矩阵', () => {
      const expected = {
        width: 2,
        height: 2,
        pixels: [
          [1, 0],
          [0, 1],
        ],
      };

      const input: JudgeInput = {
        strategy: 'pixel',
        expected,
        output: {
          events: [
            { type: 'pixel', x: 0, y: 0, value: 1 },
            { type: 'pixel', x: 1, y: 1, value: 1 },
          ],
        },
        args: {
          similarityThreshold: 0.95,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true);
    });
  });

  describe('从stdout解析', () => {
    it('应该从PIXEL_MATRIX JSON解析', () => {
      const expected = {
        width: 2,
        height: 2,
        pixels: [
          [1, 0],
          [0, 1],
        ],
      };

      const input: JudgeInput = {
        strategy: 'pixel',
        expected,
        output: {
          stdout: `PIXEL_MATRIX: ${JSON.stringify(expected)}`,
        },
        args: {
          similarityThreshold: 0.95,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true);
    });

    it('应该从pixel命令解析', () => {
      const expected = {
        width: 2,
        height: 2,
        pixels: [
          [1, 0],
          [0, 1],
        ],
      };

      const input: JudgeInput = {
        strategy: 'pixel',
        expected,
        output: {
          stdout: 'pixel 0 0 1\npixel 1 1 1',
        },
        args: {
          similarityThreshold: 0.95,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理没有像素数据的情况', () => {
      const input: JudgeInput = {
        strategy: 'pixel',
        expected: { width: 2, height: 2, pixels: [[0, 0], [0, 0]] },
        output: {
          stdout: 'Hello World',
        },
        args: {},
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No pixel matrix found');
    });

    it('应该处理无效的JSON', () => {
      const input: JudgeInput = {
        strategy: 'pixel',
        expected: { width: 2, height: 2, pixels: [[0, 0], [0, 0]] },
        output: {
          stdout: 'PIXEL_MATRIX: {invalid json}',
        },
        args: {},
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No pixel matrix found');
    });
  });
});
