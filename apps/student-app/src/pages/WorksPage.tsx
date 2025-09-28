import { Card } from '@kids/ui-kit';

export function WorksPage() {
  return (
    <div style={{ padding: '20px' }}>
      <Card heading="🎨 作品集">
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f8faff',
            borderRadius: '10px',
            border: '1px solid #e0e7ff',
            textAlign: 'center',
          }}
        >
          <h3>作品集功能正在开发中...</h3>
          <p>这里将展示你的创意编程作品</p>
          <ul style={{ textAlign: 'left', marginTop: '20px' }}>
            <li>✅ 作品展示与分享</li>
            <li>✅ 作品点赞与评论</li>
            <li>✅ 作品分类与搜索</li>
            <li>✅ 创作灵感推荐</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
