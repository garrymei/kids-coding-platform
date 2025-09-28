import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button } from '@kids/ui-kit';
import { levelRepo, type Level } from '../services/level.repo';
import { IORunner } from '../games/io/IORunner';
import { LazyLEDRunner, LazyMazeRunner, LazyComponentWrapper } from '../components/LazyComponents';
import { LoadingSpinner } from '../components/LoadingStates';

export function PlayPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLevel = async () => {
      if (!levelId) return;
      
      try {
        setLoading(true);
        const levelData = await levelRepo.getLevelById(levelId);
        if (levelData) {
          setLevel(levelData);
        } else {
          setError(`关卡 ${levelId} 未找到`);
        }
      } catch (err) {
        setError('加载关卡失败');
        // console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadLevel();
  }, [levelId]);

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <Card heading="🎮 关卡加载中...">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>正在加载关卡数据...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Card heading="❌ 加载失败">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>{error}</p>
            <Button onClick={() => window.history.back()}>返回</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!level) {
    return (
      <div style={{ padding: '20px' }}>
        <Card heading="❓ 关卡未找到">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>抱歉，找不到您请求的关卡。</p>
            <Button onClick={() => window.history.back()}>返回</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card heading={`🎮 ${level.title}`}>
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
          {/* 关卡信息 */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8faff', 
            borderRadius: '10px',
            border: '1px solid #e0e7ff'
          }}>
            <h3>任务目标</h3>
            <ul>
              {level.goals.map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
            </ul>
            
            {level.story && (
              <>
                <h3>背景故事</h3>
                <p>{level.story}</p>
              </>
            )}
            
            {level.hints && level.hints.length > 0 && (
              <>
                <h3>提示</h3>
                <ul>
                  {level.hints.map((hint, index) => (
                    <li key={index}>{hint}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* IO Runner */}
          {level.gameType === 'io' && <IORunner level={level} />}

          {/* LED Runner - 懒加载 */}
          {level.gameType === 'led' && (
            <LazyComponentWrapper fallback={<LoadingSpinner text="加载LED游戏..." />}>
              <LazyLEDRunner level={level} />
            </LazyComponentWrapper>
          )}

          {/* Maze Runner - 懒加载 */}
          {level.gameType === 'maze' && (
            <LazyComponentWrapper fallback={<LoadingSpinner text="加载迷宫游戏..." />}>
              <LazyMazeRunner level={level} />
            </LazyComponentWrapper>
          )}

          {/* 其他类型的游戏运行器可以在这里添加 */}
          
          <div style={{ textAlign: 'center' }}>
            <Button onClick={() => window.history.back()}>返回</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}