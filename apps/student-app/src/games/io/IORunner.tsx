import { useState } from 'react';
import { Card, Button } from '@kids/ui-kit';
import type { Level } from '../../services/level.repo';
import { progressStore } from '../../store/progress';
import { useStudentActions } from '../../store/studentStore'; // Add this import

interface JudgeResult {
  passed: boolean;
  message: string;
  details?: string;
}

export function IORunner({ level }: { level: Level }) {
  const [code, setCode] = useState(level.starter?.code || '');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const { refreshStats } = useStudentActions(); // Add this hook

  const judgeIO = (): JudgeResult => {
    // 这是一个本地判题的模拟实现
    // 在实际应用中，这会调用后端的执行器服务
    
    if (!level.grader.io) {
      return {
        passed: false,
        message: '关卡配置错误：缺少IO判题配置'
      };
    }

    try {
      // 获取输入数据
      const inputData = input || (level.grader.io.cases[0]?.in || '');
      
      // 简单的字符串匹配检查
      const expectedOutput = level.grader.io.cases[0]?.out || '';
      
      // 这里我们模拟代码执行结果
      // 在实际应用中，这会是真正的代码执行结果
      let actualOutput = '';
      
      // 对于特定的关卡，我们提供预设的正确输出
      if (level.id === 'py-io-001') {
        // "你好，实验岛！" 关卡
        if (code.includes("Hello, Island!")) {
          actualOutput = "Hello, Island!\n";
        } else {
          actualOutput = code.trim() + "\n";
        }
      } else if (level.id === 'py-io-002') {
        // "回声频道" 关卡
        actualOutput = inputData;
      } else {
        // 其他关卡使用简单的模拟
        actualOutput = code.trim() + "\n";
      }
      
      // 比较输出
      const passed = actualOutput === expectedOutput;
      
      return {
        passed,
        message: passed ? '🎉 恭喜通关！' : '❌ 答案不正确',
        details: passed ? 
          `输入: ${inputData || '(无输入)'}\n期望输出: ${expectedOutput}\n实际输出: ${actualOutput}` :
          `输入: ${inputData || '(无输入)'}\n期望输出: ${expectedOutput}\n实际输出: ${actualOutput}`
      };
    } catch (error) {
      return {
        passed: false,
        message: '❌ 执行出错',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const handleRun = () => {
    setIsRunning(true);
    setResult(null);
    setShowReward(false);
    
    // 模拟执行时间
    setTimeout(() => {
      const result = judgeIO();
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
      
      setIsRunning(false);
    }, 500);
  };

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
                <label>代码编辑器</label>
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
                  placeholder="在这里编写你的代码..."
                />
              </div>
              
              {level.grader.io && level.grader.io.cases.length > 0 && level.grader.io.cases[0].in && (
                <div>
                  <label>输入数据</label>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="输入数据（如果需要）"
                    style={{ 
                      width: '100%', 
                      padding: '8px',
                      borderRadius: '5px',
                      border: '1px solid #ddd'
                    }}
                  />
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                    示例输入: {level.grader.io.cases[0].in.replace(/\n/g, '\\n')}
                  </div>
                </div>
              )}
              
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
        
        {/* 结果区 */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <Card heading="🏁 运行结果">
            <div style={{ minHeight: '200px' }}>
              {result ? (
                <div>
                  <div style={{ 
                    padding: '10px', 
                    borderRadius: '5px',
                    backgroundColor: result.passed ? '#d4edda' : '#f8d7da',
                    color: result.passed ? '#155724' : '#721c24',
                    border: `1px solid ${result.passed ? '#c3e6cb' : '#f5c6cb'}`
                  }}>
                    <strong>{result.message}</strong>
                  </div>
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
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#999' 
                }}>
                  点击"运行代码"查看结果
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}