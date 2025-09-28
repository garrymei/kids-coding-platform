import { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, message, Modal, Select, DatePicker } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

interface AuthorizationOverview {
  pendingRequests: number;
  activeRelationships: number;
  classCount: number;
  recentActivities: Array<{
    action: string;
    timestamp: string;
    metadata: any;
  }>;
}

interface PendingRequest {
  id: string;
  requester: {
    id: string;
    displayName: string;
    email: string;
    role: {
      name: string;
    };
  };
  purpose: string;
  scope: string[];
  reason: string;
  expiresAt?: string;
  createdAt: string;
}

interface ActiveRelationship {
  id: string;
  party: {
    id: string;
    displayName: string;
    email: string;
    role: {
      name: string;
    };
  };
  source: string;
  accessGrants: Array<{
    id: string;
    scope: string[];
    expiresAt?: string;
    createdAt: string;
  }>;
  createdAt: string;
}

interface ClassRelationship {
  id: string;
  class: {
    id: string;
    name: string;
    description?: string;
    code: string;
    teacher: {
      id: string;
      displayName: string;
      email: string;
    };
  };
  status: string;
  joinedAt: string;
  canLeave: boolean;
}

const AuthorizationCenterPage: React.FC = () => {
  const [overview, setOverview] = useState<AuthorizationOverview | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [activeRelationships, setActiveRelationships] = useState<ActiveRelationship[]>([]);
  const [classRelationships, setClassRelationships] = useState<ClassRelationship[]>([]);
  const [_loading] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [approvalData, setApprovalData] = useState({
    scopes: [] as string[],
    expiresAt: undefined as any,
  });

  // 获取授权中心概览
  const fetchOverview = async () => {
    try {
      // TODO: 调用 API 获取概览
      // const response = await api.get('/students/authorization-center/overview');
      // setOverview(response.data);

      // 模拟数据
      setOverview({
        pendingRequests: 2,
        activeRelationships: 5,
        classCount: 3,
        recentActivities: [
          {
            action: 'approve_relationship_request',
            timestamp: '2024-01-03T10:00:00Z',
            metadata: { requesterId: 'parent-1', scopes: ['progress:read', 'works:read'] },
          },
        ],
      });
    } catch (error) {
      message.error('获取概览失败');
    }
  };

  // 获取待处理请求
  const fetchPendingRequests = async () => {
    try {
      // TODO: 调用 API 获取待处理请求
      // const response = await api.get('/students/authorization-center/pending-requests');
      // setPendingRequests(response.data);

      // 模拟数据
      setPendingRequests([
        {
          id: '1',
          requester: {
            id: 'parent-1',
            displayName: '张妈妈',
            email: 'parent@example.com',
            role: { name: 'parent' },
          },
          purpose: 'parent-view',
          scope: ['progress:read', 'works:read'],
          reason: '想了解孩子的学习情况',
          expiresAt: '2024-12-31T23:59:59Z',
          createdAt: '2024-01-03T10:00:00Z',
        },
      ]);
    } catch (error) {
      message.error('获取待处理请求失败');
    }
  };

  // 获取活跃关系
  const fetchActiveRelationships = async () => {
    try {
      // TODO: 调用 API 获取活跃关系
      // const response = await api.get('/students/authorization-center/active-relationships');
      // setActiveRelationships(response.data);

      // 模拟数据
      setActiveRelationships([
        {
          id: '1',
          party: {
            id: 'teacher-1',
            displayName: '李老师',
            email: 'teacher@example.com',
            role: { name: 'teacher' },
          },
          source: 'CLASS_INVITE',
          accessGrants: [
            {
              id: 'grant-1',
              scope: ['progress:read', 'metrics:read', 'works:read'],
              expiresAt: '2024-12-31T23:59:59Z',
              createdAt: '2024-01-01T10:00:00Z',
            },
          ],
          createdAt: '2024-01-01T10:00:00Z',
        },
      ]);
    } catch (error) {
      message.error('获取活跃关系失败');
    }
  };

  // 获取班级关系
  const fetchClassRelationships = async () => {
    try {
      // TODO: 调用 API 获取班级关系
      // const response = await api.get('/students/authorization-center/class-relationships');
      // setClassRelationships(response.data);

      // 模拟数据
      setClassRelationships([
        {
          id: '1',
          class: {
            id: 'class-1',
            name: '初一(3)班',
            description: '编程入门班级',
            code: 'A1B2C3',
            teacher: {
              id: 'teacher-1',
              displayName: '李老师',
              email: 'teacher@example.com',
            },
          },
          status: 'ACTIVE',
          joinedAt: '2024-01-01T10:00:00Z',
          canLeave: true,
        },
      ]);
    } catch (error) {
      message.error('获取班级关系失败');
    }
  };

  // 批准请求
  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    try {
      // TODO: 调用 API 批准请求
      // await api.post(`/students/authorization-center/approve-request/${selectedRequest.id}`, approvalData);
      // message.success('请求已批准');
      // setApproveModalVisible(false);
      // fetchPendingRequests();
      // fetchActiveRelationships();

      message.success('请求已批准（模拟）');
      setApproveModalVisible(false);
    } catch (error) {
      message.error('批准请求失败');
    }
  };

  // 拒绝请求
  const handleRejectRequest = async (_requestId: string) => {
    Modal.confirm({
      title: '确认拒绝',
      icon: <ExclamationCircleOutlined />,
      content: '确定要拒绝这个关注请求吗？',
      onOk: async () => {
        try {
          // TODO: 调用 API 拒绝请求
          // await api.post(`/students/authorization-center/reject-request/${requestId}`, {});
          // message.success('请求已拒绝');
          // fetchPendingRequests();

          message.success('请求已拒绝（模拟）');
        } catch (error) {
          message.error('拒绝请求失败');
        }
      },
    });
  };

  // 撤销关系
  const handleRevokeRelationship = async (_relationshipId: string) => {
    Modal.confirm({
      title: '确认撤销',
      icon: <ExclamationCircleOutlined />,
      content: '确定要撤销这个关系吗？撤销后对方将无法再查看您的数据。',
      onOk: async () => {
        try {
          // TODO: 调用 API 撤销关系
          // await api.delete(`/students/authorization-center/revoke-relationship/${relationshipId}`, {});
          // message.success('关系已撤销');
          // fetchActiveRelationships();

          message.success('关系已撤销（模拟）');
        } catch (error) {
          message.error('撤销关系失败');
        }
      },
    });
  };

  // 退出班级
  const handleLeaveClass = async (_classId: string) => {
    Modal.confirm({
      title: '确认退出',
      icon: <ExclamationCircleOutlined />,
      content: '确定要退出这个班级吗？退出后老师将无法再查看您的数据。',
      onOk: async () => {
        try {
          // TODO: 调用 API 退出班级
          // await api.post(`/students/authorization-center/leave-class/${classId}`, {});
          // message.success('已退出班级');
          // fetchClassRelationships();
          // fetchActiveRelationships();

          message.success('已退出班级（模拟）');
        } catch (error) {
          message.error('退出班级失败');
        }
      },
    });
  };

  useEffect(() => {
    fetchOverview();
    fetchPendingRequests();
    fetchActiveRelationships();
    fetchClassRelationships();
  }, []);

  const pendingColumns = [
    {
      title: '申请人',
      dataIndex: ['requester', 'displayName'],
      key: 'requester',
      render: (name: string, record: PendingRequest) => (
        <div>
          <div>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.requester.role.name === 'parent' ? '家长' : '教师'}
          </div>
        </div>
      ),
    },
    {
      title: '申请目的',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (purpose: string) => (
        <Tag color="blue">{purpose === 'parent-view' ? '家长查看' : '教师查看'}</Tag>
      ),
    },
    {
      title: '申请范围',
      dataIndex: 'scope',
      key: 'scope',
      render: (scope: string[]) => (
        <Space wrap>
          {scope.map((s) => (
            <Tag key={s} color="green">
              {s}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '申请理由',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: PendingRequest) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => {
              setSelectedRequest(record);
              setApprovalData({
                scopes: record.scope,
                expiresAt: record.expiresAt ? new Date(record.expiresAt) : undefined,
              });
              setApproveModalVisible(true);
            }}
          >
            批准
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleRejectRequest(record.id)}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  const relationshipColumns = [
    {
      title: '关系方',
      dataIndex: ['party', 'displayName'],
      key: 'party',
      render: (name: string, record: ActiveRelationship) => (
        <div>
          <div>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.party.role.name === 'parent' ? '家长' : '教师'}
          </div>
        </div>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (
        <Tag color={source === 'CLASS_INVITE' ? 'blue' : 'green'}>
          {source === 'CLASS_INVITE' ? '班级邀请' : '搜索申请'}
        </Tag>
      ),
    },
    {
      title: '授权范围',
      dataIndex: 'accessGrants',
      key: 'accessGrants',
      render: (grants: any[]) => (
        <Space wrap>
          {grants.map((grant) =>
            grant.scope.map((s: string) => (
              <Tag key={s} color="green">
                {s}
              </Tag>
            )),
          )}
        </Space>
      ),
    },
    {
      title: '过期时间',
      dataIndex: 'accessGrants',
      key: 'expiresAt',
      render: (grants: any[]) =>
        grants[0]?.expiresAt ? new Date(grants[0].expiresAt).toLocaleDateString() : '永不过期',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: ActiveRelationship) => (
        <Button danger size="small" onClick={() => handleRevokeRelationship(record.id)}>
          撤销
        </Button>
      ),
    },
  ];

  const classColumns = [
    {
      title: '班级名称',
      dataIndex: ['class', 'name'],
      key: 'className',
    },
    {
      title: '教师',
      dataIndex: ['class', 'teacher', 'displayName'],
      key: 'teacher',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? '已加入' : '已退出'}
        </Tag>
      ),
    },
    {
      title: '加入时间',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: ClassRelationship) => (
        <Button
          danger
          size="small"
          disabled={!record.canLeave}
          onClick={() => handleLeaveClass(record.class.id)}
        >
          退出班级
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h2>授权中心</h2>

      {/* 概览卡片 */}
      {overview && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />
              <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 'bold' }}>
                {overview.pendingRequests}
              </div>
              <div style={{ color: '#666' }}>待处理请求</div>
            </div>
          </Card>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <UserOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
              <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 'bold' }}>
                {overview.activeRelationships}
              </div>
              <div style={{ color: '#666' }}>活跃关系</div>
            </div>
          </Card>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 'bold' }}>
                {overview.classCount}
              </div>
              <div style={{ color: '#666' }}>加入班级</div>
            </div>
          </Card>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
              <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 'bold' }}>
                {overview.recentActivities.length}
              </div>
              <div style={{ color: '#666' }}>最近活动</div>
            </div>
          </Card>
        </div>
      )}

      {/* 待处理请求 */}
      <Card title="待处理请求" style={{ marginBottom: '24px' }}>
        <Table
          columns={pendingColumns}
          dataSource={pendingRequests}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* 活跃关系 */}
      <Card title="活跃关系" style={{ marginBottom: '24px' }}>
        <Table
          columns={relationshipColumns}
          dataSource={activeRelationships}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* 班级关系 */}
      <Card title="班级关系">
        <Table
          columns={classColumns}
          dataSource={classRelationships}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* 批准请求模态框 */}
      <Modal
        title="批准关注请求"
        open={approveModalVisible}
        onOk={handleApproveRequest}
        onCancel={() => setApproveModalVisible(false)}
        width={600}
      >
        {selectedRequest && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <strong>申请人：</strong>
              {selectedRequest.requester.displayName}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>申请理由：</strong>
              {selectedRequest.reason}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label>授权范围：</label>
              <Select
                mode="multiple"
                value={approvalData.scopes}
                onChange={(value) => setApprovalData({ ...approvalData, scopes: value })}
                style={{ width: '100%' }}
                options={[
                  { label: 'progress:read - 查看学习进度', value: 'progress:read' },
                  { label: 'works:read - 查看作品', value: 'works:read' },
                  { label: 'metrics:read - 查看指标数据', value: 'metrics:read' },
                ]}
              />
            </div>
            <div>
              <label>过期时间（可选）：</label>
              <DatePicker
                value={approvalData.expiresAt}
                onChange={(date) => setApprovalData({ ...approvalData, expiresAt: date })}
                style={{ width: '100%' }}
                showTime
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuthorizationCenterPage;
