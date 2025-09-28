import { useState, useEffect } from 'react';
import { Card, Button } from '@kids/ui-kit';
import type { Level } from '../../services/level.repo';
import { progressStore } from '../../store/progress';
import { useStudentActions } from '../../store/studentStore'; // Add this import

// Maze cell types
type MazeCell = '#' | '.' | 'S' | 'E';
type Direction = 'N' | 'E' | 'S' | 'W';

interface MazePosition {
  x: number;
  y: number;
  direction: Direction;
}

interface MazeEvent {
  type: 'move' | 'turn' | 'scan';
  position: MazePosition;
  result?: string;
  timestamp: number;
}

interface JudgeResult {
  passed: boolean;
  message: string;
  details?: string;
  events?: MazeEvent[];
  steps?: number;
  goalReached?: boolean;
}

interface MazeGridProps {
  maze: string[];
  robotPosition: MazePosition;
  path: MazePosition[];
}

function MazeGrid({ maze, robotPosition, path }: MazeGridProps) {
  // Convert string maze to 2D array
  const grid: MazeCell[][] = maze.map(row => row.split('') as MazeCell[]);
  const height = grid.length;
  const width = grid[0]?.length || 0;

  // Create a set of visited positions for path visualization
  const visitedPositions = new Set(
    path.map(pos => `${pos.x},${pos.y}`)
  );

  // Direction arrows
  const directionArrows: Record<Direction, string> = {
    N: '↑',
    E: '→',
    S: '↓',
    W: '←'
  };

  return (
    <div style={{ 
      display: 'inline-block',
      padding: '20px',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      border: '2px solid #333'
    }}>
      {grid.map((row, y) => (
        <div key={y} style={{ display: 'flex' }}>
          {row.map((cell, x) => {
            const isRobot = robotPosition.x === x && robotPosition.y === y;
            const isVisited = visitedPositions.has(`${x},${y}`);
            const isStart = cell === 'S';
            const isEnd = cell === 'E';
            
            let backgroundColor = '#fff';
            let color = '#000';
            
            if (cell === '#') {
              backgroundColor = '#333';
              color = '#fff';
            } else if (isStart) {
              backgroundColor = '#4CAF50';
              color = '#fff';
            } else if (isEnd) {
              backgroundColor = '#F44336';
              color = '#fff';
            } else if (isVisited) {
              backgroundColor = '#BBDEFB';
            }
            
            return (
              <div
                key={`${x}-${y}`}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '1px solid #ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor,
                  color,
                  fontWeight: isRobot ? 'bold' : 'normal',
                  position: 'relative'
                }}
              >
                {isRobot ? (
                  <div style={{ 
                    fontSize: '20px',
                    transform: 'translateY(-2px)'
                  }}>
                    {directionArrows[robotPosition.direction]}
                  </div>
                ) : (
                  cell === '#' ? '█' : cell
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function MazeRunner({ level }: { level: Level }) {
  const [code, setCode] = useState(level.starter?.code || '');
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [events, setEvents] = useState<MazeEvent[]>([]);
  const [currentPosition, setCurrentPosition] = useState<MazePosition>({ 
    x: 0, 
    y: 0, 
    direction: 'N' 
  });
  const [path, setPath] = useState<MazePosition[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const { refreshStats } = useStudentActions(); // Add this hook

  // Parse the maze from level assets (type assertion since assets is not in the base Level type)
  const maze = (level as any).assets?.maze || ['#####', '#S..E#', '#####'];
  
  // Find start position in maze
  useEffect(() => {
    let startX = 1;
    let startY = 1;
    
    for (let y = 0; y < maze.length; y++) {
      const x = maze[y].indexOf('S');
      if (x !== -1) {
        startX = x;
        startY = y;
        break;
      }
    }
    
    setCurrentPosition({ x: startX, y: startY, direction: 'N' });
    setPath([{ x: startX, y: startY, direction: 'N' }]);
  }, [maze]);

  // Parse code to extract maze events
  const parseMazeEvents = (code: string): MazeEvent[] => {
    const events: MazeEvent[] = [];
    const lines = code.split('\n');
    let timestamp = 0;
    let position: MazePosition = { ...currentPosition };
    const pathPositions: MazePosition[] = [position];

    lines.forEach((line) => {
      // Match move() calls
      if (line.includes('move()')) {
        // Calculate new position based on direction
        let newX = position.x;
        let newY = position.y;
        
        switch (position.direction) {
          case 'N': newY--; break;
          case 'E': newX++; break;
          case 'S': newY++; break;
          case 'W': newX--; break;
        }
        
        position = { ...position, x: newX, y: newY };
        pathPositions.push(position);
        
        events.push({
          type: 'move',
          position: { ...position },
          timestamp: timestamp++
        });
      }
      
      // Match turn_left() calls
      if (line.includes('turn_left()')) {
        const directions: Direction[] = ['N', 'W', 'S', 'E'];
        const currentIndex = directions.indexOf(position.direction);
        const newIndex = (currentIndex + 1) % directions.length;
        position = { ...position, direction: directions[newIndex] };
        
        events.push({
          type: 'turn',
          position: { ...position },
          result: 'left',
          timestamp: timestamp++
        });
      }
      
      // Match scan() calls
      if (line.includes('scan()')) {
        events.push({
          type: 'scan',
          position: { ...position },
          timestamp: timestamp++
        });
      }
    });

    setPath(pathPositions);
    return events;
  };

  // Check if code contains required structures
  const checkRequiredStructures = (code: string, requiredStructures: string[] = []): { valid: boolean; message: string } => {
    // Check for function definitions
    if (requiredStructures.includes('def')) {
      const hasDef = /def\s+\w+\s*\(/.test(code);
      if (!hasDef) {
        return { valid: false, message: '未使用函数定义' };
      }
    }
    
    return { valid: true, message: '' };
  };

  // Judge maze solution
  const judgeMaze = (): JudgeResult => {
    if (!level.grader) {
      return {
        passed: false,
        message: '关卡配置错误：缺少判题配置'
      };
    }

    try {
      const parsedEvents = parseMazeEvents(code);
      setEvents(parsedEvents);

      // Find end position
      let endX = 0;
      let endY = 0;
      for (let y = 0; y < maze.length; y++) {
        const x = maze[y].indexOf('E');
        if (x !== -1) {
          endX = x;
          endY = y;
          break;
        }
      }

      // Check if goal was reached
      let goalReached = false;
      let finalPosition = currentPosition;
      
      if (parsedEvents.length > 0) {
        const lastEvent = parsedEvents[parsedEvents.length - 1];
        finalPosition = lastEvent.position;
        goalReached = finalPosition.x === endX && finalPosition.y === endY;
      }

      // Check step count
      const stepCount = parsedEvents.filter(e => e.type === 'move').length;
      const maxSteps = (level as any).assets?.maxSteps3Star || 10;
      const stepsWithinLimit = stepCount <= maxSteps;

      // Check structure constraints (if required)
      let structureValid = true;
      let structureMessage = '';
      
      if ((level.grader as any).constraints?.requireStructures) {
        const checkResult = checkRequiredStructures(
          code, 
          (level.grader as any).constraints.requireStructures
        );
        structureValid = checkResult.valid;
        structureMessage = checkResult.message;
      }

      // Determine pass/fail
      let passed = goalReached && stepsWithinLimit && structureValid;
      let message = '';
      
      if (passed) {
        message = '🎉 恭喜通关！';
      } else if (!goalReached) {
        message = '❌ 未到达终点';
      } else if (!stepsWithinLimit) {
        message = `❌ 步数超限 (${stepCount}/${maxSteps})`;
      } else if (!structureValid) {
        message = `❌ ${structureMessage}`;
      }

      return {
        passed,
        message,
        details: `步数: ${stepCount}/${maxSteps}\n${structureMessage}`,
        events: parsedEvents,
        steps: stepCount,
        goalReached
      };
    } catch (error) {
      return {
        passed: false,
        message: '❌ 解析出错',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const handleRun = () => {
    setIsRunning(true);
    setResult(null);
    setShowReward(false);
    setIsPlaying(false);
    
    // Simulate execution time
    setTimeout(() => {
      const result = judgeMaze();
      setResult(result);
      
      // If passed, update progress and show reward
      if (result.passed) {
        progressStore.completeLevel(
          level.id, 
          level.rewards.xp, 
          level.rewards.coins
        );
        // Refresh student stats to update streak and XP
        refreshStats();
        setShowReward(true);
      }
      
      setIsRunning(false);
    }, 500);
  };

  // Playback controls
  const startPlayback = () => {
    if (events.length > 0) {
      setIsPlaying(true);
      setPlaybackIndex(0);
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
  };

  // Update robot position during playback
  useEffect(() => {
    if (isPlaying && events.length > 0) {
      const interval = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, events.length]);

  useEffect(() => {
    if (events.length > 0 && playbackIndex < events.length) {
      setCurrentPosition(events[playbackIndex].position);
    }
  }, [playbackIndex, events]);

  return (
    <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
      {/* Reward popup */}
      {showReward && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000,
          textAlign: 'center',
          border: '3px solid gold'
        }}>
          <h2>🏆 通关奖励</h2>
          <div style={{ fontSize: '24px', margin: '20px 0' }}>
            🌟 3 星通关！
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '20px 0' }}>
            <div>
              <div style={{ fontSize: '20px' }}>💎</div>
              <div>+{level.rewards.xp} XP</div>
            </div>
            <div>
              <div style={{ fontSize: '20px' }}>🪙</div>
              <div>+{level.rewards.coins} 金币</div>
            </div>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setShowReward(false)}
            style={{ minWidth: '120px' }}
            disabled={isRunning}
          >
            继续挑战
          </Button>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Editor area */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <Card heading="📝 编程区">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label>代码编辑器</label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={12}
                  style={{ 
                    width: '100%', 
                    fontFamily: 'monospace',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                  placeholder="在这里编写你的代码...\n使用 API: move(), turn_left(), scan()"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button 
                  variant="primary" 
                  onClick={handleRun} 
                  disabled={isRunning}
                >
                  {isRunning ? '运行中...' : '▶ 运行代码'}
                </Button>
                
                {events.length > 0 && (
                  <>
                    <Button 
                      variant="secondary" 
                      onClick={startPlayback}
                      disabled={isPlaying}
                    >
                      ▶ 播放
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={stopPlayback}
                      disabled={!isPlaying}
                    >
                      ⏹ 停止
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
        
        {/* Maze visualization */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <Card heading="🎮 迷宫探索">
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '20px'
            }}>
              <MazeGrid 
                maze={maze} 
                robotPosition={currentPosition} 
                path={path} 
              />
              
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '5px',
                width: '100%'
              }}>
                <div>当前位置: ({currentPosition.x}, {currentPosition.y})</div>
                <div>方向: {currentPosition.direction}</div>
                <div>步数: {events.filter(e => e.type === 'move').length}</div>
              </div>
              
              {result && (
                <div style={{ 
                  padding: '10px', 
                  borderRadius: '5px',
                  backgroundColor: result.passed ? '#d4edda' : '#f8d7da',
                  color: result.passed ? '#155724' : '#721c24',
                  border: `1px solid ${result.passed ? '#c3e6cb' : '#f5c6cb'}`,
                  width: '100%'
                }}>
                  <strong>{result.message}</strong>
                  {result.details && (
                    <div style={{ 
                      marginTop: '5px', 
                      fontFamily: 'monospace',
                      fontSize: '12px'
                    }}>
                      {result.details}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      
      {/* Event log */}
      {events.length > 0 && (
        <Card heading="📋 执行日志">
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            {events.map((event, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '5px',
                  backgroundColor: index === playbackIndex ? '#e3f2fd' : 'transparent'
                }}
              >
                [{event.timestamp}] {event.type} - 
                Position: ({event.position.x}, {event.position.y}, {event.position.direction})
                {event.result && ` - Result: ${event.result}`}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}