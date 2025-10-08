import React from 'react';
import { GameTesterPanel } from '../components/GameTesterPanel';

const GameTesterPage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--background-secondary, #f8fafc)',
      padding: '20px 0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 10px 0'
          }}>
            🧪 全局游戏检验系统
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            margin: '0',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            自动测试所有关卡，确保游戏逻辑正确性，防止反复出现问题
          </p>
        </div>
        
        <GameTesterPanel />
        
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: 'var(--background)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            color: 'var(--text-primary)',
            fontSize: '16px'
          }}>
            📖 使用说明
          </h3>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>
              点击"开始测试"按钮将自动扫描并测试所有关卡
            </li>
            <li style={{ marginBottom: '8px' }}>
              测试过程中会显示实时进度和结果统计
            </li>
            <li style={{ marginBottom: '8px' }}>
              测试完成后可查看详细的失败关卡信息
            </li>
            <li style={{ marginBottom: '8px' }}>
              建议在代码修改后运行此测试，确保没有破坏现有功能
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameTesterPage;