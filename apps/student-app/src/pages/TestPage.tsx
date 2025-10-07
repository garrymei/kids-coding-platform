import { Link } from 'react-router-dom';

export default function TestPage() {
  return (
    <div style={{ padding: '2rem', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem', marginBottom: '1rem' }}>
        🎉 学生端应用正常运行！
      </h1>
      <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
        <p>如果你能看到这个页面，说明应用已经成功启动。</p>
        <p>现在可以体验以下功能：</p>
        <ul style={{ marginTop: '1rem' }}>
          <li>🏠 首页 - 今日任务、推荐关卡、成就展示</li>
          <li>🗺️ 课程地图 - React Flow可视化</li>
          <li>🏆 排行榜 - 全局/班级切换</li>
          <li>📋 今日任务 - 任务列表</li>
          <li>🎨 作品集 - 作品展示</li>
          <li>🏅 成就系统 - 徽章网格</li>
          <li>▶️ Play页面 - 标准化反馈</li>
          <li>📚 课程学习 - 新增StudyRunner组件</li>
        </ul>

        {/* 新增：StudyRunner 快速访问 */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'rgba(76, 175, 80, 0.1)',
            borderRadius: '8px',
            border: '2px solid rgba(76, 175, 80, 0.3)',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            🆕 测试 StudyRunner（课程学习组件）
          </h3>
          <p style={{ marginBottom: '1rem' }}>选择一个关卡开始测试：</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Python 游戏 */}
            <div
              style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}
            >
              <h4 style={{ marginTop: 0, color: '#3776ab' }}>🐍 Python</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link
                  to="/learn/python/maze_navigator/1"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  迷宫导航 - 第1关
                </Link>
                <Link
                  to="/learn/python/turtle_artist/1"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  海龟画家 - 第1关
                </Link>
                <Link
                  to="/learn/python/robot_sorter/1"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  机器人分拣 - 第1关
                </Link>
              </div>
            </div>

            {/* JavaScript 游戏 */}
            <div
              style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}
            >
              <h4 style={{ marginTop: 0, color: '#f7df1e' }}>⚡ JavaScript</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link
                  to="/learn/javascript/maze_navigator/1"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  迷宫导航 - 第1关
                </Link>
                <Link
                  to="/learn/javascript/turtle_artist/1"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  海龟画家 - 第1关
                </Link>
                <Link
                  to="/learn/javascript/robot_sorter/1"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  机器人分拣 - 第1关
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(93, 168, 255, 0.1)',
            borderRadius: '8px',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>
            💡 提示：如果首页显示空白，请检查浏览器控制台是否有错误信息。
          </p>
        </div>
      </div>
    </div>
  );
}
