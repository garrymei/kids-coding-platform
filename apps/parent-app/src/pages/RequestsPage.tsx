import { useEffect } from 'react';
import { Tabs, List, Avatar, Tag, Spin } from 'antd';
import { useRequestStore } from '../stores/request';

const { TabPane } = Tabs;

function RequestList({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const { requests, loading, error, fetchRequests } = useRequestStore();

  useEffect(() => {
    fetchRequests(status);
  }, [status, fetchRequests]);

  if (loading) {
    return (
      <Spin tip="Loading...">
        <div style={{ height: 200 }} />
      </Spin>
    );
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <List
      itemLayout="horizontal"
      dataSource={requests}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            avatar={<Avatar src={`https://joeschmoe.io/api/v1/random?u=${item.studentId}`} />}
            title={item.studentName}
            description={`Request sent: ${new Date(item.createdAt).toLocaleDateString()}`}
          />
          <Tag color={status === 'pending' ? 'orange' : status === 'approved' ? 'green' : 'red'}>
            {item.status}
          </Tag>
        </List.Item>
      )}
    />
  );
}

export function RequestsPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>My Sent Requests</h1>
      <Tabs defaultActiveKey="pending">
        <TabPane tab="Pending" key="pending">
          <RequestList status="pending" />
        </TabPane>
        <TabPane tab="Approved" key="approved">
          <RequestList status="approved" />
        </TabPane>
        <TabPane tab="Rejected" key="rejected">
          <RequestList status="rejected" />
        </TabPane>
      </Tabs>
    </div>
  );
}
