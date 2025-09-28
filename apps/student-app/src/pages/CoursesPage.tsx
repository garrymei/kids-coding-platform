import { Badge, Button, Card, Progress } from '@kids/ui-kit';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GamePack } from '@kids/types';
import { levelRepo } from '../services/level.repo';
import { useStudentState, useStudentActions } from '../store/studentStore.js';
import { progressStore } from '../store/progress';

export function CoursesPage() {
  const navigate = useNavigate();
  const { focusCourseId } = useStudentState();
  const actions = useStudentActions();
  const [gamePacks, setGamePacks] = useState<GamePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [packProgress, setPackProgress] = useState<Record<string, { completed: number; total: number }>>({});

  useEffect(() => {
    // Refresh stats from progress store
    actions.refreshStats();
    
    async function loadGamePacks() {
      try {
        const packs = await levelRepo.getPacks('python');
        setGamePacks(packs);
        
        // Calculate progress for each pack
        const progress = progressStore.getProgress();
        const newPackProgress: Record<string, { completed: number; total: number }> = {};
        
        for (const pack of packs) {
          const levels = await levelRepo.getLevels('python', pack.gameType);
          const completed = levels.filter(level => 
            progress.completedLevels.includes(level.id)
          ).length;
          
          newPackProgress[pack.gameType] = {
            completed,
            total: levels.length
          };
        }
        
        setPackProgress(newPackProgress);
      } catch (_error) {
        // console.error('Failed to load game packs:', _error);
      } finally {
        setLoading(false);
      }
    }

    loadGamePacks();
  }, []);

  if (loading) {
    return (
      <div className="page-section">
        <div className="page-section__header">
          <h2>我的课程</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>加载课程中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="page-section__header">
        <h2>我的课程</h2>
        <Badge tone="info" text={`已解锁 ${gamePacks.length} 个游戏包`} />
      </div>
      <div className="course-grid">
        {gamePacks.map((pack) => {
          const isFocused = pack.gameType === focusCourseId;
          const progress = packProgress[pack.gameType] || { completed: 0, total: 0 };
          const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
          
          return (
            <Card
              key={pack.gameType}
              heading={pack.name}
              style={{ border: isFocused ? '2px solid rgba(132, 107, 255, 0.45)' : undefined }}
            >
              <div className="course-card__tags">
                <Badge text={pack.world} tone="info" />
                <Badge text={`${pack.levelCount} 关`} tone="info" />
                {progress.completed > 0 && (
                  <Badge text={`${progress.completed}/${progress.total}`} tone="success" />
                )}
              </div>
              <p style={{ margin: '12px 0', color: '#666', fontSize: '14px' }}>{pack.summary}</p>
              
              {progress.total > 0 && (
                <div style={{ margin: '15px 0' }}>
                  <Progress value={progressPercent} label={`进度: ${progress.completed}/${progress.total}`} />
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                <div>
                  {pack.unlock.requires.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      需要先完成: {pack.unlock.requires.map(req => {
                        const [, gameType] = req.split('/');
                        return gameType;
                      }).join(', ')}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    解锁等级: {pack.unlock.minLevel}
                  </div>
                </div>
                
                <div className="course-card__actions">
                  <Button
                    variant={isFocused ? 'primary' : 'secondary'}
                    onClick={() => actions.setFocusCourse(pack.gameType)}
                    style={{ marginRight: '8px' }}
                  >
                    {isFocused ? '当前主线' : '设为主线'}
                  </Button>
                  <Button variant="ghost" onClick={() => navigate(`/hub/python/${pack.gameType}`)}>
                    开始挑战
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8faff', borderRadius: '8px' }}>
        <h3>📚 课程学习建议</h3>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>按照解锁顺序逐步完成课程包，循序渐进提升技能</li>
          <li>每个包都有不同的编程概念，建议全部完成</li>
          <li>完成一个包的所有关卡可获得额外奖励</li>
          <li>遇到困难时可以查看提示或向老师求助</li>
        </ul>
      </div>
    </div>
  );
}