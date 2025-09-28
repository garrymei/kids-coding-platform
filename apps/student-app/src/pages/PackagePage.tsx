import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProgressStore } from '../stores/progress';
import { List, Typography, Skeleton, Tag } from 'antd';
import { CheckCircleFilled, SyncOutlined, LockFilled } from '@ant-design/icons';

const { Title } = Typography;

const statusIcons = {
  done: <CheckCircleFilled style={{ color: 'green' }} />,
  in_progress: <SyncOutlined spin style={{ color: 'blue' }} />,
  locked: <LockFilled style={{ color: 'grey' }} />,
};

export default function PackagePage() {
  const { pkgId } = useParams<{ pkgId: string }>();
  const { pkgCache, fetchPackage, loading } = useProgressStore();
  const packageDetails = pkgId ? pkgCache[pkgId] : null;

  useEffect(() => {
    if (pkgId) {
      fetchPackage('stu_1', pkgId);
    }
  }, [pkgId, fetchPackage]);

  if (loading || !packageDetails) {
    return <Skeleton active paragraph={{ rows: 5 }} style={{ padding: '2rem' }} />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '2rem' }}>
        Package: {pkgId}
      </Title>
      <List
        itemLayout="horizontal"
        dataSource={packageDetails.levels}
        renderItem={level => (
          <List.Item>
            <List.Item.Meta
              avatar={statusIcons[level.status]}
              title={<Link to={`/play/${level.levelId}`}>{level.levelId}</Link>}
            />
            <Tag>{level.status}</Tag>
          </List.Item>
        )}
      />
    </div>
  );
}
