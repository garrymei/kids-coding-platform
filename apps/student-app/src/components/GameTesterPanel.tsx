import React, { useState } from 'react';
import { globalGameTester } from '../utils/globalGameTester';

interface TestResult {
  levelId: string;
  passed: boolean;
  error?: string;
  gameType: string;
  category: string;
}

export const GameTesterPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [report, setReport] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setReport('');
    
    try {
      console.log('开始全局游戏检验...');
      
      // 扫描关卡
      await globalGameTester.scanLevels();
      
      // 运行测试
      const testResults = await globalGameTester.testAllLevels();
      setResults(testResults);
      
      // 生成报告
      const testReport = globalGameTester.generateReport(testResults);
      setReport(testReport);
      
      console.log('全局游戏检验完成');
    } catch (error) {
      console.error('全局游戏检验失败:', error);
      setReport(`测试失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (passed: boolean) => passed ? '✅' : '❌';
  const getStatusColor = (passed: boolean) => passed ? '#22c55e' : '#ef4444';

  return (
    <div style={{ 
      padding: '20px', 
      background: 'var(--background)', 
      borderRadius: '8px',
      border: '1px solid var(--border)',
      maxWidth: '800px',
      margin: '20px auto'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ 
          margin: '0 0 10px 0', 
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🧪 全局游戏检验系统
        </h2>
        <p style={{ 
          margin: '0', 
          color: 'var(--text-secondary)',
          fontSize: '14px'
        }}>
          自动测试所有关卡，确保游戏逻辑正确性
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runTests}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            background: isRunning ? '#6b7280' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginRight: '10px'
          }}
        >
          {isRunning ? '🔄 测试中...' : '▶️ 开始测试'}
        </button>
        
        {results.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {showDetails ? '隐藏详情' : '显示详情'}
          </button>
        )}
      </div>

      {report && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.1)',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{ 
            margin: '0 0 10px 0', 
            color: 'var(--text-primary)',
            fontSize: '16px'
          }}>
            📊 测试报告
          </h3>
          <pre style={{
            margin: '0',
            color: 'var(--text-primary)',
            fontSize: '13px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          }}>
            {report}
          </pre>
        </div>
      )}

      {showDetails && results.length > 0 && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.05)',
          padding: '15px',
          borderRadius: '6px',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            color: 'var(--text-primary)',
            fontSize: '16px'
          }}>
            📋 详细结果
          </h3>
          
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {results.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  background: result.passed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${getStatusColor(result.passed)}`,
                  fontSize: '13px'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: result.error ? '5px' : '0'
                }}>
                  <span>{getStatusIcon(result.passed)}</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {result.levelId}
                  </strong>
                  <span style={{ 
                    color: 'var(--text-secondary)',
                    fontSize: '12px'
                  }}>
                    ({result.gameType}/{result.category})
                  </span>
                </div>
                {result.error && (
                  <div style={{ 
                    color: '#ef4444',
                    fontSize: '12px',
                    marginLeft: '24px'
                  }}>
                    {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};