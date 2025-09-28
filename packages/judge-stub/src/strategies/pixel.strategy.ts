import { JudgeStrategy, JudgeInput, JudgeResult, PixelMatrix, PixelExpected, PixelArgs, PixelVisualization } from './judge-strategy.interface';

export class PixelStrategy implements JudgeStrategy {
  name = 'pixel';

  judge(input: JudgeInput): JudgeResult {
    const { expected, output, args = {} } = input;
    const pixelArgs: PixelArgs = {
      tolerance: 0,
      similarityThreshold: 0.95,
      mode: 'gray',
      perChannelTolerance: 5,
      allowScale: false,
      ...args,
    };

    try {
      // 从 artifacts 中获取像素矩阵
      const actualMatrix = this.extractPixelMatrix(output);
      if (!actualMatrix) {
        return {
          passed: false,
          message: 'No pixel matrix found in execution output',
          details: 'Expected pixelMatrix in output.artifacts',
        };
      }

      // 标准化期望值
      const expectedMatrix = this.normalizeExpected(expected);

      // 尺寸检查
      if (!this.checkDimensions(expectedMatrix, actualMatrix, pixelArgs)) {
        return {
          passed: false,
          message: 'Dimension mismatch',
          details: `Expected ${expectedMatrix.width}x${expectedMatrix.height}, got ${actualMatrix.width}x${actualMatrix.height}`,
          warnings: pixelArgs.allowScale ? ['Dimensions will be scaled'] : undefined,
        };
      }

      // 执行比较
      const comparison = this.compareMatrices(expectedMatrix, actualMatrix, pixelArgs);

      // 生成可视化数据
      const visualization: PixelVisualization = {
        expected: expectedMatrix,
        actual: actualMatrix,
        diffMatrix: comparison.diffMatrix,
      };

      return {
        passed: comparison.similarity >= pixelArgs.similarityThreshold!,
        message: comparison.similarity >= pixelArgs.similarityThreshold! 
          ? 'Pixel matrix matches expected output' 
          : `Pixel similarity ${(comparison.similarity * 100).toFixed(1)}% below threshold ${(pixelArgs.similarityThreshold! * 100).toFixed(1)}%`,
        details: `Similarity: ${(comparison.similarity * 100).toFixed(1)}%, Different pixels: ${comparison.diffCount}/${comparison.totalPixels}`,
        visualization,
        metrics: {
          similarity: comparison.similarity,
          diffCount: comparison.diffCount,
          totalPixels: comparison.totalPixels,
        },
        warnings: comparison.warnings,
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Pixel comparison failed',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private extractPixelMatrix(output: JudgeInput['output']): PixelMatrix | null {
    // 优先从 artifacts 获取
    if (output.artifacts?.pixelMatrix) {
      return output.artifacts.pixelMatrix as PixelMatrix;
    }

    // 从 events 中解析像素数据
    if (output.events) {
      return this.parsePixelEvents(output.events);
    }

    // 从 stdout 中解析
    if (output.stdout) {
      return this.parsePixelStdout(output.stdout);
    }

    return null;
  }

  private parsePixelEvents(events: Array<Record<string, any>>): PixelMatrix | null {
    const pixelEvents = events.filter(e => e.type === 'pixel');
    if (pixelEvents.length === 0) return null;

    // 找到最大坐标来确定尺寸
    let maxX = 0, maxY = 0;
    for (const event of pixelEvents) {
      maxX = Math.max(maxX, event.x || 0);
      maxY = Math.max(maxY, event.y || 0);
    }

    const width = maxX + 1;
    const height = maxY + 1;
    const pixels: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));

    // 填充像素数据
    for (const event of pixelEvents) {
      const x = event.x || 0;
      const y = event.y || 0;
      const value = event.value || 0;
      pixels[y][x] = value;
    }

    return { width, height, pixels };
  }

  private parsePixelStdout(stdout: string): PixelMatrix | null {
    // 查找 PIXEL_MATRIX: 前缀的 JSON 数据
    const match = stdout.match(/PIXEL_MATRIX:\s*(\{[\s\S]*?\})/);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        return data as PixelMatrix;
      } catch (error) {
        console.warn('Failed to parse PIXEL_MATRIX JSON:', error);
      }
    }

    // 解析 pixel x y v 格式
    const pixelLines = stdout.split('\n').filter(line => line.trim().startsWith('pixel '));
    if (pixelLines.length === 0) return null;

    return this.parsePixelEvents(
      pixelLines.map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          type: 'pixel',
          x: parseInt(parts[1]) || 0,
          y: parseInt(parts[2]) || 0,
          value: parseInt(parts[3]) || 0,
        };
      })
    );
  }

  private normalizeExpected(expected: PixelExpected): PixelMatrix {
    if ('imageData' in expected) {
      // 转换 ImageData 为像素矩阵
      const { imageData, width, height, mode } = expected;
      const pixels: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * (mode === 'rgba' ? 4 : 1);
          if (mode === 'rgba') {
            // 转换为灰度值
            const r = imageData[index];
            const g = imageData[index + 1];
            const b = imageData[index + 2];
            pixels[y][x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          } else {
            pixels[y][x] = imageData[index];
          }
        }
      }

      return { width, height, pixels };
    }

    return expected as PixelMatrix;
  }

  private checkDimensions(expected: PixelMatrix, actual: PixelMatrix, args: PixelArgs): boolean {
    if (expected.width === actual.width && expected.height === actual.height) {
      return true;
    }

    if (args.allowScale) {
      return true; // 允许缩放
    }

    return false;
  }

  private compareMatrices(expected: PixelMatrix, actual: PixelMatrix, args: PixelArgs): {
    similarity: number;
    diffCount: number;
    totalPixels: number;
    diffMatrix: number[][];
    warnings?: string[];
  } {
    let expectedMatrix = expected;
    let actualMatrix = actual;
    const warnings: string[] = [];

    // 如果需要缩放
    if (args.allowScale && (expected.width !== actual.width || expected.height !== actual.height)) {
      actualMatrix = this.scaleMatrix(actual, expected.width, expected.height);
      warnings.push(`Scaled actual matrix from ${actual.width}x${actual.height} to ${expected.width}x${expected.height}`);
    }

    const { width, height } = expectedMatrix;
    const diffMatrix: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));
    let diffCount = 0;
    const totalPixels = width * height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const expectedValue = this.getPixelValue(expectedMatrix.pixels, x, y);
        const actualValue = this.getPixelValue(actualMatrix.pixels, x, y);

        if (this.isPixelDifferent(expectedValue, actualValue, args)) {
          diffMatrix[y][x] = 1;
          diffCount++;
        }
      }
    }

    const similarity = 1 - diffCount / totalPixels;

    return {
      similarity,
      diffCount,
      totalPixels,
      diffMatrix,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private getPixelValue(pixels: number[][] | number[][][], x: number, y: number): number | number[] {
    const row = pixels[y];
    if (!row) return 0;

    const value = row[x];
    if (Array.isArray(value)) {
      return value; // RGB
    }
    return value; // 灰度
  }

  private isPixelDifferent(expected: number | number[], actual: number | number[], args: PixelArgs): boolean {
    if (Array.isArray(expected) && Array.isArray(actual)) {
      // RGB 比较
      if (expected.length !== actual.length) return true;
      
      for (let i = 0; i < expected.length; i++) {
        if (Math.abs(expected[i] - actual[i]) > args.perChannelTolerance!) {
          return true;
        }
      }
      return false;
    } else if (typeof expected === 'number' && typeof actual === 'number') {
      // 灰度比较
      return Math.abs(expected - actual) > args.tolerance!;
    }

    return true; // 类型不匹配
  }

  private scaleMatrix(matrix: PixelMatrix, targetWidth: number, targetHeight: number): PixelMatrix {
    const { width, height, pixels } = matrix;
    const scaledPixels: number[][] = Array(targetHeight).fill(null).map(() => Array(targetWidth).fill(0));

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        // 最近邻缩放
        const sourceX = Math.round((x * width) / targetWidth);
        const sourceY = Math.round((y * height) / targetHeight);
        
        if (sourceX < width && sourceY < height) {
          scaledPixels[y][x] = this.getPixelValue(pixels, sourceX, sourceY) as number;
        }
      }
    }

    return {
      width: targetWidth,
      height: targetHeight,
      pixels: scaledPixels,
    };
  }
}
