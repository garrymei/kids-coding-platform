import React, { useEffect } from 'react';
import { Tabs, List, Avatar, Tag, Spin, Button, Space, Popconfirm } from 'antd';
import { useConsentStore } from '../stores/consent';

const { TabPane } = Tabs;

type ConsentStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

function ConsentList({ status }: { status: ConsentStatus }) {
  const { consents, loading, error, fetchConsents, approveConsent, rejectConsent, revokeConsent } = useConsentStore();

  useEffect(() => {
    fetchConsents(status);
  }, [status, fetchConsents]);

  const handleApprove = (id: string) => {
    approveConsent(id).then(() => fetchConsents(status));
  };

  const handleReject = (id: string) => {
    rejectConsent(id).then(() => fetchConsents(status));
  };

  const handleRevoke = (id: string) => {
    revokeConsent(id).then(() => fetchConsents(status));
  };

  if (loading) {
    return <Spin tip="Loading..."><div style={{ height: 200 }} /></Spin>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <List
      itemLayout="horizontal"
      dataSource={consents}
      renderItem={item => (
        <List.Item
          actions={[
            status === 'pending' && (
              <Space>
                <Button type="primary" onClick={() => handleApprove(item.id)}>Approve</Button>
                <Button danger onClick={() => handleReject(item.id)}>Reject</Button>
              </Space>
            ),
            status === 'approved' && (
              <Popconfirm
                title="Are you sure you want to revoke this consent?"
                onConfirm={() => handleRevoke(item.id)}
                okText="Yes, Revoke"
                cancelText="Cancel"
              >
                <Button type="dashed" danger>Revoke</Button>
              </Popconfirm>
            ),
          ]}
        >
          <List.Item.Meta
            avatar={<Avatar>{item.requesterName[0]}</Avatar>}
            title={item.requesterName}
            description={`Note: ${item.note || 'N/A'} | Requested on: ${new Date(item.createdAt).toLocaleDateString()}`}
          />
        </List.Item>
      )}
    />
  );
}

export function ConsentsPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Consent Management</h1>
      <Tabs defaultActiveKey="pending">
        <TabPane tab="Pending" key="pending">
          <ConsentList status="pending" />
        </TabPane>
        <TabPane tab="Approved" key="approved">
          <ConsentList status="approved" />
        </TabPane>
        <TabPane tab="Rejected" key="rejected">
          <ConsentList status="rejected" />
        </TabPane>
        <TabPane tab="Revoked" key="revoked">
          <ConsentList status="revoked" />
        </TabPane>
      </Tabs>
    </div>
  );
}
