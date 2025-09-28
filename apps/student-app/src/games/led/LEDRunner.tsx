import { useState } from 'react';
import { Card, Button } from '@kids/ui-kit';
import type { Level } from '../../services/level.repo';
import { progressStore } from '../../store/progress';
import { httpClient } from '../../services/http';
import { useStudentActions } from '../../store/studentStore'; // Add this import

interface LEDEvent {
  type: 'on' | 'off';
  index: number;
  timestamp: number;
}

interface JudgeResult {
  passed: boolean;
  message: string;
  details?: string;
  events?: LEDEvent[];
  finalState?: string;
}

interface LEDGridProps {
  width: number;
  height: number;
  events: LEDEvent[];
  currentTime: number;
}

function LEDGrid({ width, height, events, currentTime }: LEDGridProps) {
  const grid = Array(height).fill(null).map(() => Array(width).fill(false));
  
  // 计算当前时间点的LED状态
  events.forEach(event => {
    if (event.timestamp <= currentTime) {
      const row = Math.floor(event.index / width);
      const col = event.index % width;
      if (row < height && col < width) {
        grid[row][col] = event.type === 'on';
      }
    }
  });

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: `repeat(${width}, 1fr)`,
      gap: '4px',
      padding: '20px',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      border: '2px solid #333'
    }}>
      {grid.flat().map((isOn, index) => (
        <div
          key={index}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: isOn ? '#ffd700' : '#333',
            border: '2px solid #555',
            boxShadow: isOn ? '0 0 20px #ffd700' : 'none',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: isOn ? '#000' : '#666'
          }}
        >
          {index}
        </div>
      ))}
    </div>
  );
}

export function LEDRunner({ level }: { level: Level }) {
  const [code, setCode] = useState(level.starter?.code || '');
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [events, setEvents] = useState<LEDEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useRemoteJudge, setUseRemoteJudge] = useState(false);
  const { refreshStats } = useStudentActions(); // Add this hook

  // 解析代码中的LED事件
  const parseLEDEvents = (code: string): LEDEvent[] => {
    const events: LEDEvent[] = [];
    const lines = code.split('\n');
    let timestamp = 0;

    lines.forEach((line) => {
      // 匹配 on{i} 和 off{i} 模式
      const onMatch = line.match(/on(\d+)/g);
      const offMatch = line.match(/off(\d+)/g);
      
      if (onMatch) {
        onMatch.forEach(match => {
          const index = parseInt(match.replace('on', ''));
          events.push({
            type: 'on',
            index,
            timestamp: timestamp++
          });
        });
      }
      
      if (offMatch) {
        offMatch.forEach(match => {
          const index = parseInt(match.replace('off', ''));
          events.push({
            type: 'off',
            index,
            timestamp: timestamp++
          });
        });
      }
    });

    return events;
  };

  // 计算最终LED状态
  const calculateFinalState = (events: LEDEvent[], width: number): string => {
    const state = Array(width).fill('0');
    
    events.forEach(event => {
      if (event.index < width) {
        state[event.index] = event.type === 'on' ? '1' : '0';
      }
    });
    
    return state.join('');
  };

  // 远程判题逻辑
  const judgeLEDRemote = async (): Promise<JudgeResult> => {
    try {
      const response: any = await httpClient.post('/judge/led', {
        body: JSON.stringify({
          code,
          grader: level.grader,
          assets: (level as any).assets
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return {
        passed: response.ok,
        message: response.message,
        details: response.details,
        events: response.events || [],
        finalState: response.finalState
      };
    } catch (error) {
      return {
        passed: false,
        message: '❌ 远程判题失败',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // 本地判题逻辑
  const judgeLED = (): JudgeResult => {
    if (!level.grader) {
      return {
        passed: false,
        message: '关卡配置错误：缺少判题配置'
      };
    }

    try {
      const parsedEvents = parseLEDEvents(code);
      setEvents(parsedEvents);

      if (level.grader.mode === 'event') {
        // 事件序列判题
        const expectedEvents = (level.grader as any).checks?.[0]?.expect || [];
        const actualEvents = parsedEvents.map(e => `on${e.index}`);
        
        const passed = JSON.stringify(actualEvents) === JSON.stringify(expectedEvents);
        
        return {
          passed,
          message: passed ? '🎉 事件序列正确！' : '❌ 事件序列不匹配',
          details: `期望: [${expectedEvents.join(', ')}]\n实际: [${actualEvents.join(', ')}]`,
          events: parsedEvents
        };
      } else if (level.grader.mode === 'io') {
        // IO 输出判题
        const expectedOutput = level.grader.io?.cases?.[0]?.out?.trim() || '';
        const finalState = calculateFinalState(parsedEvents, (level as any).assets?.gridWidth || 8);
        
        const passed = finalState === expectedOutput;
        
        return {
          passed,
          message: passed ? '🎉 终局状态正确！' : '❌ 终局状态不匹配',
          details: `期望: ${expectedOutput}\n实际: ${finalState}`,
          events: parsedEvents,
          finalState
        };
      }

      return {
        passed: false,
        message: '不支持的判题模式'
      };
    } catch (error) {
      return {
        passed: false,
        message: '❌ 解析出错',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    setShowReward(false);
    setCurrentTime(0);
    setIsPlaying(false);
    
    try {
      let result: JudgeResult;
      
      if (useRemoteJudge) {
        // 远程判题
        result = await judgeLEDRemote();
      } else {
        // 本地判题
        result = judgeLED();
      }
      
      setResult(result);
      
      // 如果通关，更新进度并显示奖励
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
    } catch (error) {
      setResult({
        passed: false,
        message: '❌ 执行出错',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handlePlay = () => {
    if (events.length === 0) return;
    
    setIsPlaying(true);
    setCurrentTime(0);
    
    const maxTime = Math.max(...events.map(e => e.timestamp));
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= maxTime) {
          setIsPlaying(false);
          clearInterval(interval);
          return maxTime;
        }
        return prev + 1;
      });
    }, 500);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const gridWidth = (level as any).assets?.gridWidth || 8;
  const gridHeight = (level as any).assets?.gridHeight || 1;

  return (
    <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
      {/* 奖励弹层 */}
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
          >
            继续挑战
          </Button>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* 编辑区 */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <Card heading="📝 编程区">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label>LED 控制代码</label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={10}
                  style={{ 
                    width: '100%', 
                    fontFamily: 'monospace',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                  placeholder="在这里编写你的LED控制代码..."
                />
              </div>
              
              <div style={{ fontSize: '12px', color: '#666', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                <strong>LED 控制语法：</strong><br/>
                • <code>on0</code> - 点亮 0 号灯<br/>
                • <code>off0</code> - 熄灭 0 号灯<br/>
                • 支持循环：<code>{'for i in range(5): print(f"on{i}")'}</code>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useRemoteJudge}
                    onChange={(e) => setUseRemoteJudge(e.target.checked)}
                  />
                  <span style={{ fontSize: '12px' }}>使用远程判题</span>
                </label>
                <span style={{ fontSize: '10px', color: '#888' }}>
                  {useRemoteJudge ? '🌐 服务器判题' : '💻 本地判题'}
                </span>
              </div>
              
              <div>
                <Button 
                  variant="primary" 
                  onClick={handleRun} 
                  disabled={isRunning}
                  style={{ minWidth: '120px' }}
                >
                  {isRunning ? '运行中...' : '▶ 运行代码'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        {/* LED 显示器 */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <Card heading="💡 LED 灯阵">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <LEDGrid 
                width={gridWidth} 
                height={gridHeight} 
                events={events} 
                currentTime={currentTime} 
              />
              
              {events.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <Button 
                    variant="secondary" 
                    onClick={handlePlay}
                    disabled={isPlaying}
                    style={{ minWidth: '80px' }}
                  >
                    {isPlaying ? '播放中...' : '▶ 播放'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleReset}
                    style={{ minWidth: '80px' }}
                  >
                    🔄 重置
                  </Button>
                </div>
              )}
              
              {result?.finalState && (
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#f0f0f0', 
                  borderRadius: '5px',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontSize: '16px'
                }}>
                  终局状态 <strong>{result.finalState}</strong>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      
      {/* 结果区 */}
      {result && (
        <Card heading="🏁 运行结果">
          <div style={{ 
            padding: '10px', 
            borderRadius: '5px',
            backgroundColor: result.passed ? '#d4edda' : '#f8d7da',
            color: result.passed ? '#155724' : '#721c24',
            border: `1px solid ${result.passed ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            <strong>{result.message}</strong>
            {result.details && (
              <div style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '5px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                fontSize: '12px'
              }}>
                {result.details}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}