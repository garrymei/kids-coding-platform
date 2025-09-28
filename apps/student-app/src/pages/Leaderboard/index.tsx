import { useState } from 'react';
import { Badge, Button } from '@kids/ui-kit';
import { leaderboardMock } from './data';

export function LeaderboardPage() {
  const [showRules, setShowRules] = useState(false);
  
  return (
    <div className="page-section">
      <div className="page-section__header">
        <h2>🏆 排行榜</h2>
        <Button variant="text" onClick={() => setShowRules(!showRules)}>
          规则说明
        </Button>
      </div>
      
      {showRules && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>排行榜规则</h3>
          <ul>
            <li>排名基于累计获得的 XP 值</li>
            <li>首次通过关卡获得 10 XP，重复通过获得 2 XP</li>
            <li>每日首次登录获得 1 XP</li>
            <li>连续学习天数达到特定值会获得额外奖励</li>
            <li>排行榜每日更新一次</li>
          </ul>
        </div>
      )}
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>排名</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>昵称</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>XP</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>连续天数</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardMock.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>
                {item.rank <= 3 ? (
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: item.rank === 1 ? 'gold' : item.rank === 2 ? 'silver' : 'bronze' 
                  }}>
                    {item.rank}
                  </span>
                ) : (
                  item.rank
                )}
              </td>
              <td style={{ padding: '10px' }}>{item.user}</td>
              <td style={{ padding: '10px' }}>{item.xp}</td>
              <td style={{ padding: '10px' }}>
                {item.streak > 0 && (
                  <Badge tone="success" text={`🔥 ${item.streak}`} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}