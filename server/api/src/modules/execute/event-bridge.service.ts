import { Injectable } from '@nestjs/common';
import { ExecutionEvent, parseEvents } from './eventParser';

type JudgeGameType = 'led' | 'maze' | 'music';

@Injectable()
export class EventBridgeService {
  /**
   * Parse stdout into structured events using the shared parser definition.
   */
  collect(stdout: string | undefined | null): ExecutionEvent[] {
    return parseEvents(stdout);
  }

  /**
   * Convert structured events into the legacy judge string sequences when needed.
   * This keeps compatibility with existing judge strategies until they accept
   * structured payloads everywhere.
   */
  toJudgeSequence(events: ExecutionEvent[], game: JudgeGameType): string[] {
    switch (game) {
      case 'led':
        return events
          .filter((event): event is Extract<ExecutionEvent, { type: 'led' }> => event.type === 'led')
          .map((event) => (event.on ? `on ${event.idx}` : `off ${event.idx}`));
      case 'maze':
        return events
          .filter((event): event is Extract<ExecutionEvent, { type: 'maze_step' | 'maze_turn' }> =>
            event.type === 'maze_step' || event.type === 'maze_turn'
          )
          .map((event) => {
            if (event.type === 'maze_step') {
              return `step ${event.x} ${event.y}`;
            }
            return `turn ${event.dir}`;
          });
      case 'music':
        return events
          .filter((event): event is Extract<ExecutionEvent, { type: 'note' }> => event.type === 'note')
          .map((event) => `note ${event.track} ${event.pitch} ${event.dur}`);
      default:
        return [];
    }
  }
}
