import { MusicStrategy } from './music.strategy';
import { JudgeInput } from './judge-strategy.interface';

describe('MusicStrategy', () => {
  let strategy: MusicStrategy;

  beforeEach(() => {
    strategy = new MusicStrategy();
  });

  describe('完全匹配', () => {
    it('应该通过完全匹配的音乐序列', () => {
      const expected = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
          { pitch: 'E4', dur: 0.5, start: 0.5 },
        ],
      };

      const input: JudgeInput = {
        strategy: 'music',
        expected,
        output: {
          artifacts: {
            musicSeq: expected,
          },
        },
        args: {
          scoreThreshold: 0.85,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true);
      expect(result.metrics?.score).toBe(1);
      expect(result.metrics?.matched).toBe(2);
    });
  });

  describe('节奏错误', () => {
    it('应该识别时值错误', () => {
      const expected = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
          { pitch: 'E4', dur: 0.5, start: 0.5 },
        ],
      };

      const actual = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.25, start: 0 }, // 时值错误
          { pitch: 'E4', dur: 0.5, start: 0.5 },
        ],
      };

      const input: JudgeInput = {
        strategy: 'music',
        expected,
        output: {
          artifacts: {
            musicSeq: actual,
          },
        },
        args: {
          durTolerance: 0.05,
          scoreThreshold: 0.85,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(false);
      expect(result.visualization.rhythmErrors.length).toBe(1);
      expect(result.visualization.rhythmErrors[0].error).toBe('duration');
    });

    it('应该识别起始时间错误', () => {
      const expected = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
          { pitch: 'E4', dur: 0.5, start: 0.5 },
        ],
      };

      const actual = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0.1 }, // 起始时间错误
          { pitch: 'E4', dur: 0.5, start: 0.5 },
        ],
      };

      const input: JudgeInput = {
        strategy: 'music',
        expected,
        output: {
          artifacts: {
            musicSeq: actual,
          },
        },
        args: {
          onsetWindow: 0.05,
          scoreThreshold: 0.85,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(false);
      expect(result.visualization.rhythmErrors.length).toBe(1);
      expect(result.visualization.rhythmErrors[0].error).toBe('timing');
    });
  });

  describe('音高错误', () => {
    it('应该识别音高错误', () => {
      const expected = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
          { pitch: 'E4', dur: 0.5, start: 0.5 },
        ],
      };

      const actual = {
        tempo: 120,
        notes: [
          { pitch: 'D4', dur: 0.5, start: 0 }, // 音高错误
          { pitch: 'E4', dur: 0.5, start: 0.5 },
        ],
      };

      const input: JudgeInput = {
        strategy: 'music',
        expected,
        output: {
          artifacts: {
            musicSeq: actual,
          },
        },
        args: {
          scoreThreshold: 0.85,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(false);
      expect(result.visualization.pitchErrors.length).toBe(1);
    });
  });

  describe('节拍容差', () => {
    it('应该在容差范围内接受节拍差异', () => {
      const expected = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
        ],
      };

      const actual = {
        tempo: 122, // 在容差范围内
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
        ],
      };

      const input: JudgeInput = {
        strategy: 'music',
        expected,
        output: {
          artifacts: {
            musicSeq: actual,
          },
        },
        args: {
          tempoTolerance: 5,
          scoreThreshold: 0.85,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it('应该警告超出容差的节拍差异', () => {
      const expected = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
        ],
      };

      const actual = {
        tempo: 125, // 超出容差
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
        ],
      };

      const input: JudgeInput = {
        strategy: 'music',
        expected,
        output: {
          artifacts: {
            musicSeq: actual,
          },
        },
        args: {
          tempoTolerance: 2,
          scoreThreshold: 0.85,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true);
      expect(result.warnings).toContain('Tempo difference 5BPM > tolerance 2BPM');
    });
  });

  describe('缺失和多余音符', () => {
    it('应该识别缺失的音符', () => {
      const expected = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
          { pitch: 'E4', dur: 0.5, start: 0.5 },
        ],
      };

      const actual = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
          // 缺失 E4
        ],
      };

      const input: JudgeInput = {
        strategy: 'music',
        expected,
        output: {
          artifacts: {
            musicSeq: actual,
          },
        },
        args: {
          scoreThreshold: 0.85,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(false);
      expect(result.visualization.missingNotes.length).toBe(1);
      expect(result.visualization.missingNotes[0].pitch).toBe('E4');
    });

    it('应该识别多余的音符', () => {
      const expected = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
        ],
      };

      const actual = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
          { pitch: 'E4', dur: 0.5, start: 0.5 }, // 多余音符
        ],
      };

      const input: JudgeInput = {
        strategy: 'music',
        expected,
        output: {
          artifacts: {
            musicSeq: actual,
          },
        },
        args: {
          scoreThreshold: 0.85,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true); // 匹配的音符足够通过阈值
      expect(result.visualization.extraNotes.length).toBe(1);
      expect(result.visualization.extraNotes[0].pitch).toBe('E4');
    });
  });

  describe('从事件解析', () => {
    it('应该从音符事件构建序列', () => {
      const expected = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
          { pitch: 'E4', dur: 0.5, start: 0.5 },
        ],
      };

      const input: JudgeInput = {
        strategy: 'music',
        expected,
        output: {
          events: [
            { type: 'tempo', bpm: 120 },
            { type: 'note', track: 1, pitch: 'C4', dur: 0.5 },
            { type: 'note', track: 1, pitch: 'E4', dur: 0.5 },
          ],
        },
        args: {
          scoreThreshold: 0.85,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true);
    });
  });

  describe('从stdout解析', () => {
    it('应该从MUSIC_SEQ JSON解析', () => {
      const expected = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
        ],
      };

      const input: JudgeInput = {
        strategy: 'music',
        expected,
        output: {
          stdout: `MUSIC_SEQ: ${JSON.stringify(expected)}`,
        },
        args: {
          scoreThreshold: 0.85,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true);
    });

    it('应该从note命令解析', () => {
      const expected = {
        tempo: 120,
        notes: [
          { pitch: 'C4', dur: 0.5, start: 0 },
          { pitch: 'E4', dur: 0.5, start: 0.5 },
        ],
      };

      const input: JudgeInput = {
        strategy: 'music',
        expected,
        output: {
          stdout: 'tempo 120\nnote 1 C4 0.5\nnote 1 E4 0.5',
        },
        args: {
          scoreThreshold: 0.85,
        },
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理没有音乐数据的情况', () => {
      const input: JudgeInput = {
        strategy: 'music',
        expected: { tempo: 120, notes: [] },
        output: {
          stdout: 'Hello World',
        },
        args: {},
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No music sequence found');
    });

    it('应该处理无效的JSON', () => {
      const input: JudgeInput = {
        strategy: 'music',
        expected: { tempo: 120, notes: [] },
        output: {
          stdout: 'MUSIC_SEQ: {invalid json}',
        },
        args: {},
      };

      const result = strategy.judge(input);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No music sequence found');
    });
  });
});
