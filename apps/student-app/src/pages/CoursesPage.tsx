import { Badge, Button, Card } from '@kids/ui-kit';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GamePack } from '@kids/types';
import { levelRepo } from '../services/level.repo';
import { useStudentState, useStudentActions } from '../store/studentStore.js';

export function CoursesPage() {
  const navigate = useNavigate();
  const { focusCourseId } = useStudentState();
  const actions = useStudentActions();
  const [gamePacks, setGamePacks] = useState<GamePack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGamePacks() {
      try {
        const packs = await levelRepo.getPacks('python');
        setGamePacks(packs);
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
          return (
            <Card
              key={pack.gameType}
              heading={pack.name}
              style={{ border: isFocused ? '2px solid rgba(132, 107, 255, 0.45)' : undefined }}
            >
              <div className="course-card__tags">
                <Badge text={pack.world} tone="info" />
                <Badge text={`${pack.levelCount} 关`} tone="info" />
              </div>
              <p style={{ margin: '12px 0', color: '#666', fontSize: '14px' }}>{pack.summary}</p>
              <div className="course-card__actions">
                <Button
                  variant={isFocused ? 'primary' : 'secondary'}
                  onClick={() => actions.setFocusCourse(pack.gameType)}
                >
                  {isFocused ? '当前主线' : '设为主线'}
                </Button>
                <Button variant="ghost" onClick={() => navigate(`/hub/python/${pack.gameType}`)}>
                  开始挑战
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
