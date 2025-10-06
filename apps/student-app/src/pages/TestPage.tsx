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
        </ul>
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
