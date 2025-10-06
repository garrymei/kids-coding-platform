export default function DailyTaskPage() {
  return (
    <div className="kc-container" style={{ padding: '2rem 0' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h1 className="kc-section-title" style={{ color: 'var(--accent-primary)' }}>
          📅 今日任务
        </h1>
        <p className="text-muted" style={{ marginTop: '1rem', fontSize: '1rem' }}>
          任务系统正在开发中，请稍后体验。
        </p>
        <div style={{ marginTop: '2rem' }}>
          <div
            className="alert alert-warn"
            style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem' }}
          >
            💡 即将上线：每日学习任务、挑战目标、进度跟踪等功能
          </div>
        </div>
      </div>
    </div>
  );
}
