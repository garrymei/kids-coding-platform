import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Work {
  id: string;
  studentId: string;
  title: string;
  coverUrl: string;
  codeUrl?: string;
  createdAt: string;
  likes: number;
  visibility: 'class' | 'public';
  levelType?: 'pixel' | 'maze' | 'led' | 'music';
  liked?: boolean;
}

// Mock 数据
const mockWorks: Work[] = [
  {
    id: 'work_1',
    studentId: 'stu_1',
    title: '点阵笑脸',
    coverUrl: '🙂',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    likes: 12,
    visibility: 'class',
    levelType: 'pixel',
    liked: false,
  },
  {
    id: 'work_2',
    studentId: 'stu_1',
    title: '迷宫探索',
    coverUrl: '🗺️',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    likes: 8,
    visibility: 'public',
    levelType: 'maze',
    liked: true,
  },
  {
    id: 'work_3',
    studentId: 'stu_1',
    title: 'LED 灯光秀',
    coverUrl: '💡',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    likes: 15,
    visibility: 'class',
    levelType: 'led',
    liked: false,
  },
  {
    id: 'work_4',
    studentId: 'stu_1',
    title: '音乐旋律',
    coverUrl: '🎵',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    likes: 20,
    visibility: 'public',
    levelType: 'music',
    liked: true,
  },
];

const levelTypeLabels = {
  pixel: { label: '像素画', color: '#a78bfa', icon: '🎨' },
  maze: { label: '迷宫', color: '#22c55e', icon: '🎯' },
  led: { label: 'LED', color: '#f59e0b', icon: '💡' },
  music: { label: '音乐', color: '#ec4899', icon: '🎵' },
};

export default function WorksPage() {
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'class' | 'public'>('all');

  useEffect(() => {
    loadWorks();
  }, []);

  const loadWorks = async () => {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 300));
    setWorks(mockWorks);
  };

  const handleLike = async (workId: string) => {
    setWorks((prev) =>
      prev.map((work) =>
        work.id === workId
          ? { ...work, likes: work.liked ? work.likes - 1 : work.likes + 1, liked: !work.liked }
          : work,
      ),
    );
  };

  const filteredWorks = works.filter((work) => filter === 'all' || work.visibility === filter);

  return (
    <div className="kc-container" style={{ padding: '2rem 0' }}>
      {/* 页面标题 */}
      <header style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h1 className="kc-section-title" style={{ fontSize: '28px', marginBottom: '0.5rem' }}>
              🎨 我的作品集
            </h1>
            <p className="text-muted">展示你的编程创意作品</p>
          </div>
          <button
            className="btn btn-cta"
            onClick={() => setShowUploadDialog(true)}
            style={{ height: '48px', padding: '0 24px' }}
          >
            ➕ 上传作品
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid duo" style={{ gap: '16px', marginBottom: '1.5rem' }}>
          <div className="card kpi-card" style={{ padding: '20px' }}>
            <div className="text-muted" style={{ fontSize: '14px' }}>
              总作品数
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>
              {works.length}
            </div>
          </div>
          <div
            className="card"
            style={{
              padding: '20px',
              background:
                'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
            }}
          >
            <div className="text-muted" style={{ fontSize: '14px' }}>
              获得点赞
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b', marginTop: '8px' }}>
              {works.reduce((sum, work) => sum + work.likes, 0)} ❤️
            </div>
          </div>
        </div>

        {/* 筛选标签 */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: '全部' },
            { key: 'class', label: '班级可见' },
            { key: 'public', label: '公开' },
          ].map((tab) => (
            <button
              key={tab.key}
              className="btn"
              style={{
                background: filter === tab.key ? 'var(--grad-cta)' : 'rgba(148, 163, 184, 0.12)',
                border: filter === tab.key ? '1px solid #5da8ff' : '1px solid transparent',
              }}
              onClick={() => setFilter(tab.key as typeof filter)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 作品网格 */}
      {filteredWorks.length === 0 ? (
        <div className="card" style={{ padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎨</div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            {filter === 'all' ? '还没有作品' : `没有${filter === 'class' ? '班级' : '公开'}作品`}
          </h3>
          <p className="text-muted" style={{ marginBottom: '24px' }}>
            完成关卡后可以将你的创意作品上传到作品集
          </p>
          <button className="btn btn-cta" onClick={() => navigate('/courses')}>
            开始创作
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredWorks.map((work) => {
            const typeConfig = work.levelType ? levelTypeLabels[work.levelType] : null;
            return (
              <div
                key={work.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(93, 168, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
                }}
              >
                {/* 封面 */}
                <div
                  style={{
                    height: 180,
                    background:
                      'linear-gradient(135deg, rgba(93, 168, 255, 0.2), rgba(167, 139, 250, 0.2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '96px',
                    position: 'relative',
                  }}
                >
                  {work.coverUrl}
                  {/* 可见性标签 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background:
                        work.visibility === 'public'
                          ? 'rgba(34, 197, 94, 0.3)'
                          : 'rgba(93, 168, 255, 0.3)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {work.visibility === 'public' ? '🌍 公开' : '🏫 班级'}
                  </div>
                </div>

                {/* 信息区 */}
                <div style={{ padding: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    {typeConfig && (
                      <span
                        className="kc-tag"
                        style={{
                          background: `${typeConfig.color}33`,
                          color: typeConfig.color,
                          fontSize: '12px',
                        }}
                      >
                        {typeConfig.icon} {typeConfig.label}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                    {work.title}
                  </h3>
                  <div className="text-muted" style={{ fontSize: '12px', marginBottom: '12px' }}>
                    {new Date(work.createdAt).toLocaleDateString('zh-CN')}
                  </div>

                  {/* 操作栏 */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <button
                      className="btn btn-ghost"
                      style={{
                        padding: '8px 16px',
                        height: 'auto',
                        fontSize: '14px',
                        background: work.liked
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(148, 163, 184, 0.12)',
                        color: work.liked ? '#ef4444' : 'var(--text)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(work.id);
                      }}
                    >
                      {work.liked ? '❤️' : '🤍'} {work.likes}
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '8px 16px', height: 'auto', fontSize: '14px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // 查看详情
                      }}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 上传对话框（简化版） */}
      {showUploadDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setShowUploadDialog(false)}
        >
          <div
            className="card"
            style={{ padding: '32px', maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="kc-section-title" style={{ marginBottom: '24px' }}>
              上传作品
            </h2>
            <div className="text-muted" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
              <p>作品上传功能开发中...</p>
              <p style={{ fontSize: '14px', marginTop: '12px' }}>
                即将支持：截图上传、代码分享、可见性设置
              </p>
            </div>
            <button
              className="btn"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setShowUploadDialog(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
