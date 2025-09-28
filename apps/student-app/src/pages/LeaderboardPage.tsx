import { useEffect, useState } from 'react';
import { Badge, Card, Progress } from '@kids/ui-kit';
import { useStudentState } from '../store/studentStore';

interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  avatarUrl?: string;
  rank: number;
}

export function LeaderboardPage() {
  const { xp } = useStudentState();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading leaderboard data
    setTimeout(() => {
      // Generate fake leaderboard data
      const fakeData: LeaderboardEntry[] = [
        { id: '1', name: '小明', xp: xp, avatarUrl: undefined, rank: 1 },
        { id: '2', name: '小红', xp: 1500, avatarUrl: undefined, rank: 2 },
        { id: '3', name: '小刚', xp: 1420, avatarUrl: undefined, rank: 3 },
        { id: '4', name: '小丽', xp: 1380, avatarUrl: undefined, rank: 4 },
        { id: '5', name: '小强', xp: 1250, avatarUrl: undefined, rank: 5 },
        { id: '6', name: '小美', xp: 1100, avatarUrl: undefined, rank: 6 },
        { id: '7', name: '小华', xp: 980, avatarUrl: undefined, rank: 7 },
        { id: '8', name: '小杰', xp: 850, avatarUrl: undefined, rank: 8 },
        { id: '9', name: '小芳', xp: 720, avatarUrl: undefined, rank: 9 },
        { id: '10', name: '小勇', xp: 600, avatarUrl: undefined, rank: 10 },
      ];
      
      // Sort by XP descending
      fakeData.sort((a, b) => b.xp - a.xp);
      
      // Update ranks
      fakeData.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      setLeaderboard(fakeData);
      setLoading(false);
    }, 500);
  }, [xp]);

  if (loading) {
    return (
      <div className="page-section">
        <div className="page-section__header">
          <h2>🏆 排行榜</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>加载排行榜中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="page-section__header">
        <h2>🏆 排行榜</h2>
        <Badge tone="info" text="按 XP 排名" />
      </div>
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {leaderboard.map((entry) => (
          <Card 
            key={entry.id}
            style={{ 
              marginBottom: '15px',
              border: entry.id === '1' ? '2px solid gold' : '1px solid #eee',
              backgroundColor: entry.id === '1' ? '#fff8e1' : 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: entry.rank <= 3 ? '#ffd700' : '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: entry.rank <= 3 ? '#000' : '#666',
                marginRight: '15px'
              }}>
                {entry.rank}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{entry.name}</strong>
                    {entry.id === '1' && (
                      <Badge 
                        text="你自己" 
                        tone="success" 
                        style={{ marginLeft: '10px' }} 
                      />
                    )}
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    {entry.xp} XP
                  </div>
                </div>
                
                <div style={{ marginTop: '8px' }}>
                  <Progress 
                    value={Math.min(100, entry.xp / 20)} 
                    label={`等级 ${Math.floor(entry.xp / 200) + 1}`}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f8faff', 
        borderRadius: '8px',
        maxWidth: '800px',
        margin: '30px auto 0'
      }}>
        <h3>🏅 排行榜规则</h3>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>按累计 XP 排名，XP 越高排名越靠前</li>
          <li>完成关卡可获得 XP 奖励</li>
          <li>连续学习可获得额外 XP 加成</li>
          <li>每周会重置部分排名，鼓励持续学习</li>
        </ul>
      </div>
    </div>
  );
}