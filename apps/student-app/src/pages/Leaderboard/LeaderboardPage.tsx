import { useState, useEffect } from 'react';

interface RankEntry {
  rank: number;
  studentId: string;
  name: string;
  avatar?: string;
  xp: number;
  className?: string;
}

interface Class {
  id: string;
  name: string;
}

// Mock 当前学生ID
const CURRENT_STUDENT_ID = 'stu_1';

// Mock 数据
const mockGlobalRankings: RankEntry[] = [
  { rank: 1, studentId: 'stu_5', name: '小明', xp: 1580, avatar: '👨' },
  { rank: 2, studentId: 'stu_2', name: '小红', xp: 1420, avatar: '👧' },
  { rank: 3, studentId: 'stu_3', name: '小刚', xp: 1350, avatar: '👦' },
  { rank: 4, studentId: 'stu_1', name: '我', xp: 1210, avatar: '🙋' },
  { rank: 5, studentId: 'stu_6', name: '小丽', xp: 1100, avatar: '👧' },
  { rank: 6, studentId: 'stu_7', name: '小强', xp: 980, avatar: '👨' },
  { rank: 7, studentId: 'stu_8', name: '小芳', xp: 920, avatar: '👩' },
  { rank: 8, studentId: 'stu_9', name: '小军', xp: 850, avatar: '👨' },
  { rank: 9, studentId: 'stu_10', name: '小雪', xp: 800, avatar: '👧' },
  { rank: 10, studentId: 'stu_11', name: '小龙', xp: 750, avatar: '👦' },
];

const mockClassRankings: RankEntry[] = [
  { rank: 1, studentId: 'stu_2', name: '小红', xp: 1420, avatar: '👧', className: '三年级一班' },
  { rank: 2, studentId: 'stu_1', name: '我', xp: 1210, avatar: '🙋', className: '三年级一班' },
  { rank: 3, studentId: 'stu_6', name: '小丽', xp: 1100, avatar: '👧', className: '三年级一班' },
  { rank: 4, studentId: 'stu_8', name: '小芳', xp: 920, avatar: '👩', className: '三年级一班' },
  { rank: 5, studentId: 'stu_10', name: '小雪', xp: 800, avatar: '👧', className: '三年级一班' },
];

const mockClasses: Class[] = [
  { id: 'class_1', name: '三年级一班' },
  { id: 'class_2', name: '三年级二班' },
];

const getRankMedal = (rank: number): string => {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
};

export default function LeaderboardPage() {
  const [scope, setScope] = useState<'global' | 'class'>('global');
  const [selectedClassId, setSelectedClassId] = useState<string>('class_1');
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRankings();
  }, [scope, selectedClassId]);

  const loadRankings = async () => {
    setLoading(true);
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (scope === 'global') {
      setRankings(mockGlobalRankings);
    } else {
      setRankings(mockClassRankings);
    }
    setLoading(false);
  };

  const currentStudentRank = rankings.find((r) => r.studentId === CURRENT_STUDENT_ID);

  return (
    <div className="kc-container" style={{ padding: '2rem 0' }}>
      {/* 页面标题 */}
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 className="kc-section-title" style={{ fontSize: '32px', marginBottom: '0.5rem' }}>
          🏆 经验值排行榜
        </h1>
        <p className="text-muted">与全球/班级同学一起进步</p>
      </header>

      {/* 我的排名卡片 */}
      {currentStudentRank && (
        <div
          className="card kpi-card"
          style={{
            padding: '24px',
            marginBottom: '2rem',
            background:
              'linear-gradient(135deg, rgba(93, 168, 255, 0.2), rgba(167, 139, 250, 0.2))',
            border: '2px solid rgba(93, 168, 255, 0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>
                我的排名
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '48px' }}>{currentStudentRank.avatar}</span>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>
                    {getRankMedal(currentStudentRank.rank)} 第 {currentStudentRank.rank} 名
                  </div>
                  <div style={{ fontSize: '16px', color: '#f59e0b', fontWeight: 600 }}>
                    {currentStudentRank.xp} XP
                  </div>
                </div>
              </div>
            </div>
            {currentStudentRank.rank > 1 && rankings[currentStudentRank.rank - 2] && (
              <div style={{ textAlign: 'right' }}>
                <div className="text-muted" style={{ fontSize: '12px' }}>
                  距离上一名
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#5da8ff' }}>
                  {rankings[currentStudentRank.rank - 2].xp - currentStudentRank.xp} XP
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 筛选标签 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className="btn"
          style={{
            background: scope === 'global' ? 'var(--grad-cta)' : 'rgba(148, 163, 184, 0.12)',
            border: scope === 'global' ? '2px solid #5da8ff' : '1px solid transparent',
            fontWeight: scope === 'global' ? 700 : 400,
          }}
          onClick={() => setScope('global')}
        >
          🌍 全球榜
        </button>
        <button
          className="btn"
          style={{
            background: scope === 'class' ? 'var(--grad-cta)' : 'rgba(148, 163, 184, 0.12)',
            border: scope === 'class' ? '2px solid #5da8ff' : '1px solid transparent',
            fontWeight: scope === 'class' ? 700 : 400,
          }}
          onClick={() => setScope('class')}
        >
          🏫 班级榜
        </button>

        {scope === 'class' && mockClasses.length > 0 && (
          <select
            className="btn"
            style={{
              background: 'rgba(148, 163, 184, 0.12)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: 'var(--text)',
            }}
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {mockClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 排行榜列表 */}
      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="text-muted">加载中...</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: 'rgba(148, 163, 184, 0.08)',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                  }}
                >
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>排名</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>学生</th>
                  <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>经验值</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((entry) => {
                  const isCurrentStudent = entry.studentId === CURRENT_STUDENT_ID;
                  return (
                    <tr
                      key={entry.studentId}
                      style={{
                        background: isCurrentStudent ? 'rgba(93, 168, 255, 0.15)' : 'transparent',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                        borderLeft: isCurrentStudent
                          ? '3px solid #5da8ff'
                          : '3px solid transparent',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrentStudent) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrentStudent) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '18px',
                            fontWeight: 700,
                          }}
                        >
                          <span>{getRankMedal(entry.rank)}</span>
                          <span style={{ color: isCurrentStudent ? '#fff' : 'var(--text)' }}>
                            {entry.rank}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '32px' }}>{entry.avatar}</span>
                          <div>
                            <div
                              style={{
                                fontSize: '16px',
                                fontWeight: isCurrentStudent ? 700 : 600,
                                color: isCurrentStudent ? '#fff' : 'var(--text)',
                              }}
                            >
                              {entry.name}
                              {isCurrentStudent && (
                                <span
                                  className="kc-tag"
                                  style={{
                                    marginLeft: '8px',
                                    background: 'rgba(93, 168, 255, 0.3)',
                                    fontSize: '12px',
                                  }}
                                >
                                  我
                                </span>
                              )}
                            </div>
                            {entry.className && (
                              <div className="text-muted" style={{ fontSize: '12px' }}>
                                {entry.className}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: isCurrentStudent ? '#f59e0b' : '#5da8ff',
                          }}
                        >
                          {entry.xp} XP
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 空态提示 */}
      {!loading && rankings.length === 0 && (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div className="text-muted">暂无排行数据</div>
        </div>
      )}
    </div>
  );
}
