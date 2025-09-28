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
};

export type ExecutionEvent = LedEvent | MazeStepEvent | MazeTurnEvent | MusicNoteEvent;

const LED_ON_REGEX = /^on\s*(\d+)$/i;
const LED_OFF_REGEX = /^off\s*(\d+)$/i;
const MAZE_STEP_REGEX = /^step\s+(-?\d+)\s+(-?\d+)$/i;
const MAZE_TURN_REGEX = /^turn\s+([NESW])$/i;
const MUSIC_NOTE_REGEX = /^note\s+(\d+)\s+([A-G][#b]?\d)\s+(\d+)$/i;

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
    }
  }

  return events;
}
