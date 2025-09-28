import { useEffect, useState } from 'react';
import { Badge, Button, Card } from '@kids/ui-kit';
import { useNavigate } from 'react-router-dom';

// 与后端API对齐的作品数据结构
interface Work {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  likes: number;
  tags: string[];
  thumbnailUrl?: string;
  // 添加未来可能需要的字段，与API对齐
  studentId?: string;
  cover?: string;
  liked?: boolean;
}

export function WorksPage() {
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 模拟加载作品数据
    // 未来会替换为实际API调用: fetchStudentWorks(studentId)
    setTimeout(() => {
      try {
        // 生成模拟数据
        const fakeData: Work[] = [
          {
            id: '1',
            title: '我的第一个迷宫游戏',
            description: '使用Python编写的一个简单迷宫游戏，玩家需要找到出口。',
            createdAt: '2023-05-15',
            likes: 24,
            tags: ['Python', '游戏', '迷宫'],
            thumbnailUrl: undefined,
            liked: false,
            cover: undefined
          },
          {
            id: '2',
            title: 'LED灯控动画',
            description: '通过控制LED灯阵列创建的动画效果，包含闪烁和渐变。',
            createdAt: '2023-04-22',
            likes: 18,
            tags: ['LED', '动画', '硬件'],
            thumbnailUrl: undefined,
            liked: true,
            cover: undefined
          },
          {
            id: '3',
            title: '数学计算器',
            description: '一个简单的数学计算器，支持加减乘除运算。',
            createdAt: '2023-03-10',
            likes: 15,
            tags: ['Python', '工具', '数学'],
            thumbnailUrl: undefined,
            liked: false,
            cover: undefined
          },
          {
            id: '4',
            title: '天气查询工具',
            description: '通过API获取天气信息并显示的工具应用。',
            createdAt: '2023-02-18',
            likes: 32,
            tags: ['Python', 'API', '工具'],
            thumbnailUrl: undefined,
            liked: true,
            cover: undefined
          }
        ];
      
        setWorks(fakeData);
        setLoading(false);
      } catch (err) {
        console.error('加载作品失败', err);
        setError('加载作品数据失败，请稍后再试');
        setLoading(false);
      }
    }, 500);
  }, []);

  // 加载状态
  if (loading) {
    return (
      <div className="page-section">
        <div className="page-section__header">
          <h2>🎨 作品集</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>加载作品集中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="page-section">
        <div className="page-section__header">
          <h2>🎨 作品集</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
          <p>{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="page-section__header">
        <h2>🎨 作品集</h2>
        <Badge tone="info" text={`${works.length} 个作品`} />
      </div>
      
      <div className="course-grid">
        {works.length > 0 ? (
          works.map((work) => (
            <Card key={work.id} heading={work.title}>
              <div style={{ marginBottom: '15px', color: '#666' }}>
                {work.description}
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
                {work.tags.map((tag) => (
                  <Badge key={tag} text={tag} tone="info" />
                ))}
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '14px',
                color: '#888',
                marginBottom: '15px'
              }}>
                <span>👍 {work.likes} 个赞</span>
                <span>📅 {work.createdAt}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => navigate(`/works/${work.id}`)}>
                  查看详情
                </Button>
              </div>
            </Card>
          ))
        ) : (
          // 空状态显示，符合需求中的"空列表文案"
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p>你还没有作品，去创意工坊发布吧～</p>
          </div>
        )}
      </div>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f8faff', 
        borderRadius: '8px'
      }}>
        <h3>➕ 提交新作品</h3>
        <p>完成课程项目后，可以将你的作品提交到这里展示给其他同学！</p>
        <Button variant="primary" onClick={() => navigate('/share-code')}>
          分享我的作品
        </Button>
      </div>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        backgroundColor: '#fff8e1', 
        borderRadius: '8px',
        border: '1px solid #ffd700'
      }}>
        <h3>💡 作品集小贴士</h3>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>作品集是展示你编程技能的好地方</li>
          <li>定期更新作品集可以记录你的成长历程</li>
          <li>优秀作品有机会被推荐到创意工坊首页</li>
          <li>同学可以对你的作品点赞和评论</li>
        </ul>
      </div>
    </div>
  );
}