import { useEffect } from 'react';
import { List, Button, Spin, Space, Avatar } from 'antd';
import { useParams } from 'react-router-dom';
import { useClassStore } from '../stores/class';

export function ApprovalsPage() {
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
    return (
      <Spin tip="加载中...">
        <div style={{ height: 200 }} />
      </Spin>
    );
  }

  if (error) {
    return <p>加载失败：{error}</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>班级 {classId} 的审批请求</h1>
      <List
        itemLayout="horizontal"
        dataSource={approvals}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Space key="actions">
                <Button type="primary" onClick={() => handleApprove(item.memberId)}>
                  通过
                </Button>
                <Button danger onClick={() => handleReject(item.memberId)}>
                  拒绝
                </Button>
              </Space>,
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar>{item.studentName[0]}</Avatar>}
              title={item.studentName}
              description={`申请时间：${new Date(item.requestedAt).toLocaleDateString('zh-CN')}`}
            />
          </List.Item>
        )}
      />
    </div>
  );
}