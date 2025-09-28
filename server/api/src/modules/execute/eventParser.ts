export type LedEvent = {
  type: 'led';
  idx: number;
  on: boolean;
};

export type MazeStepEvent = {
  type: 'maze_step';
  x: number;
  y: number;
};

export type MazeTurnEvent = {
  type: 'maze_turn';
  dir: 'N' | 'E' | 'S' | 'W';
};

export type MusicNoteEvent = {
  type: 'note';
  track: number;
  pitch: string;
  dur: number;
  start?: number;
};

export type PixelEvent = {
  type: 'pixel';
  x: number;
  y: number;
  value: number;
};

export type TempoEvent = {
  type: 'tempo';
  bpm: number;
};

export type ExecutionEvent = LedEvent | MazeStepEvent | MazeTurnEvent | MusicNoteEvent | PixelEvent | TempoEvent;

/**
 * 执行产物类型定义
 */
export interface ExecutionArtifacts {
  pixelMatrix?: {
    width: number;
    height: number;
    pixels: number[][] | number[][][];
  };
  musicSeq?: {
    tempo: number;
    notes: Array<{
      pitch: string;
      dur: number;
      start: number;
    }>;
  };
  [key: string]: any;
}

const LED_ON_REGEX = /^on\s*(\d+)$/i;
const LED_OFF_REGEX = /^off\s*(\d+)$/i;
const MAZE_STEP_REGEX = /^step\s+(-?\d+)\s+(-?\d+)$/i;
const MAZE_TURN_REGEX = /^turn\s+([NESW])$/i;
const MUSIC_NOTE_REGEX = /^note\s+(\d+)\s+([A-G][#b]?\d)\s+(\d+)$/i;
const PIXEL_REGEX = /^pixel\s+(\d+)\s+(\d+)\s+(\d+)$/i;
const TEMPO_REGEX = /^tempo\s+(\d+)$/i;

/**
 * Parse stdout text into structured execution events.
 * Supports LED, maze, and music event formats defined in the runtime contract.
 */
export function parseEvents(stdout: string | undefined | null): ExecutionEvent[] {
  if (!stdout) {
    return [];
  }

  const events: ExecutionEvent[] = [];
  const lines = stdout.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const ledOnMatch = line.match(LED_ON_REGEX);
    if (ledOnMatch) {
      events.push({ type: 'led', idx: Number(ledOnMatch[1]), on: true });
      continue;
    }

    const ledOffMatch = line.match(LED_OFF_REGEX);
    if (ledOffMatch) {
      events.push({ type: 'led', idx: Number(ledOffMatch[1]), on: false });
      continue;
    }

    const mazeStepMatch = line.match(MAZE_STEP_REGEX);
    if (mazeStepMatch) {
      events.push({
        type: 'maze_step',
        x: Number(mazeStepMatch[1]),
        y: Number(mazeStepMatch[2]),
      });
      continue;
    }

    const mazeTurnMatch = line.match(MAZE_TURN_REGEX);
    if (mazeTurnMatch) {
      events.push({
        type: 'maze_turn',
        dir: mazeTurnMatch[1].toUpperCase() as 'N' | 'E' | 'S' | 'W',
      });
      continue;
    }

    const musicNoteMatch = line.match(MUSIC_NOTE_REGEX);
    if (musicNoteMatch) {
      events.push({
        type: 'note',
        track: Number(musicNoteMatch[1]),
        pitch: musicNoteMatch[2].toUpperCase(),
        dur: Number(musicNoteMatch[3]),
      });
      continue;
    }

    const pixelMatch = line.match(PIXEL_REGEX);
    if (pixelMatch) {
      events.push({
        type: 'pixel',
        x: Number(pixelMatch[1]),
        y: Number(pixelMatch[2]),
        value: Number(pixelMatch[3]),
      });
      continue;
    }

    const tempoMatch = line.match(TEMPO_REGEX);
    if (tempoMatch) {
      events.push({
        type: 'tempo',
        bpm: Number(tempoMatch[1]),
      });
    }
  }

  return events;
}

/**
 * 从事件和stdout中提取执行产物
 */
export function extractArtifacts(stdout: string | undefined | null, events: ExecutionEvent[]): ExecutionArtifacts {
  const artifacts: ExecutionArtifacts = {};

  // 提取像素矩阵
  const pixelMatrix = extractPixelMatrix(stdout, events);
  if (pixelMatrix) {
    artifacts.pixelMatrix = pixelMatrix;
  }

  // 提取音乐序列
  const musicSeq = extractMusicSequence(stdout, events);
  if (musicSeq) {
    artifacts.musicSeq = musicSeq;
  }

  return artifacts;
}

/**
 * 提取像素矩阵
 */
function extractPixelMatrix(stdout: string | undefined | null, events: ExecutionEvent[]): ExecutionArtifacts['pixelMatrix'] | null {
  // 优先从 stdout 中查找 PIXEL_MATRIX JSON
  if (stdout) {
    const match = stdout.match(/PIXEL_MATRIX:\s*(\{[\s\S]*?\})/);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        if (data.width && data.height && data.pixels) {
          return data;
        }
      } catch (error) {
        console.warn('Failed to parse PIXEL_MATRIX JSON:', error);
      }
    }
  }

  // 从事件中构建像素矩阵
  const pixelEvents = events.filter(e => e.type === 'pixel') as PixelEvent[];
  if (pixelEvents.length === 0) return null;

  // 找到最大坐标来确定尺寸
  let maxX = 0, maxY = 0;
  for (const event of pixelEvents) {
    maxX = Math.max(maxX, event.x);
    maxY = Math.max(maxY, event.y);
  }

  const width = maxX + 1;
  const height = maxY + 1;
  const pixels: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));

  // 填充像素数据
  for (const event of pixelEvents) {
    pixels[event.y][event.x] = event.value;
  }

  return { width, height, pixels };
}

/**
 * 提取音乐序列
 */
function extractMusicSequence(stdout: string | undefined | null, events: ExecutionEvent[]): ExecutionArtifacts['musicSeq'] | null {
  // 优先从 stdout 中查找 MUSIC_SEQ JSON
  if (stdout) {
    const match = stdout.match(/MUSIC_SEQ:\s*(\{[\s\S]*?\})/);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        if (data.tempo && data.notes) {
          return data;
        }
      } catch (error) {
        console.warn('Failed to parse MUSIC_SEQ JSON:', error);
      }
    }
  }

  // 从事件中构建音乐序列
  const noteEvents = events.filter(e => e.type === 'note') as MusicNoteEvent[];
  const tempoEvents = events.filter(e => e.type === 'tempo') as TempoEvent[];

  if (noteEvents.length === 0) return null;

  // 获取节拍
  let tempo = 120; // 默认节拍
  if (tempoEvents.length > 0) {
    tempo = tempoEvents[0].bpm;
  }

  // 解析音符
  const notes: Array<{ pitch: string; dur: number; start: number }> = [];
  let currentTime = 0;

  for (const event of noteEvents) {
    const note = {
      pitch: event.pitch,
      dur: event.dur,
      start: event.start !== undefined ? event.start : currentTime,
    };
    notes.push(note);
    currentTime = note.start + note.dur;
  }

  return { tempo, notes };
}
