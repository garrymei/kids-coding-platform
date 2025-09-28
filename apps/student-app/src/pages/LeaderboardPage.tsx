import { Card } from '@kids/ui-kit';

export function LeaderboardPage() {
  return (
    <div style={{ padding: '20px' }}>
      <Card heading="🏆 排行榜">
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f8faff',
            borderRadius: '10px',
            border: '1px solid #e0e7ff',
            textAlign: 'center',
          }}
        >
          <h3>排行榜功能正在开发中...</h3>
          <p>与小伙伴们一起比拼编程技能</p>
          <ul style={{ textAlign: 'left', marginTop: '20px' }}>
            <li>✅ 周/月/总排行榜</li>
            <li>✅ 不同技能分类排行</li>
            <li>✅ 好友排行榜</li>
            <li>✅ 成就与徽章展示</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
