import React, { useEffect } from 'react';
import { List, Button, Spin, Space, Avatar } from 'antd';
import { useParams } from 'react-router-dom';
import { useClassStore } from '../stores/class';

export default function ApprovalsPage() {
  const { classId } = useParams<{ classId: string }>();
  const { approvals, loading, error, fetchApprovals, approveApproval, rejectApproval } = useClassStore();

  useEffect(() => {
    if (classId) {
      fetchApprovals(classId, 'pending');
    }
  }, [classId, fetchApprovals]);

  const handleApprove = (memberId: string) => {
    if (classId) {
      approveApproval(classId, memberId);
    }
  };

  const handleReject = (memberId: string) => {
    if (classId) {
      rejectApproval(classId, memberId);
    }
  };

  if (loading) {
    return <Spin tip="Loading..."><div style={{ height: 200 }} /></Spin>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Pending Approvals for Class {classId}</h1>
      <List
        itemLayout="horizontal"
        dataSource={approvals}
        renderItem={item => (
          <List.Item
            actions={[
              <Space>
                <Button type="primary" onClick={() => handleApprove(item.memberId)}>Approve</Button>
                <Button danger onClick={() => handleReject(item.memberId)}>Reject</Button>
              </Space>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar>{item.studentName[0]}</Avatar>}
              title={item.studentName}
              description={`Requested on: ${new Date(item.requestedAt).toLocaleDateString()}`}
            />
          </List.Item>
        )}
      />
    </div>
  );
}
