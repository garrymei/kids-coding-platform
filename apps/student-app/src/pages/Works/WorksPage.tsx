import { Empty, Typography } from 'antd';

const { Title } = Typography;

export default function WorksPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
        我的作品集
      </Title>
      <Empty
        description={
          <span>
            你还没有在“创意工坊”提交过作品。
            <br />
            快去创作吧！
          </span>
        }
      />
    </div>
  );
}
