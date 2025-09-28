import { List, Avatar, Typography } from 'antd';

const { Title } = Typography;

// Mock data for the leaderboard
const leaderboardData = [
  { rank: 1, name: '小明', xp: 1580, avatar: 'https://joeschmoe.io/api/v1/male/random' },
  { rank: 2, name: '小红', xp: 1420, avatar: 'https://joeschmoe.io/api/v1/female/random' },
  { rank: 3, name: '小刚', xp: 1350, avatar: 'https://joeschmoe.io/api/v1/male/random' },
  { rank: 4, name: '小华', xp: 1210, avatar: 'https://joeschmoe.io/api/v1/female/random' },
  { rank: 5, name: '小丽', xp: 1100, avatar: 'https://joeschmoe.io/api/v1/female/random' },
  { rank: 6, name: '小强', xp: 980, avatar: 'https://joeschmoe.io/api/v1/male/random' },
];

export default function LeaderboardPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
        🏆 经验值排行榜 🏆
      </Title>
      <List
        itemLayout="horizontal"
        dataSource={leaderboardData}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar src={`${item.avatar}?u=${item.rank}`} />}
              title={<a href="#">{`${item.rank}. ${item.name}`}</a>}
              description={`${item.xp} XP`}
            />
          </List.Item>
        )}
      />
    </div>
  );
}
