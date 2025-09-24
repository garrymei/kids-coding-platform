import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Table, Tag, Space, message } from 'antd';
import {
  PlusOutlined,
  CopyOutlined,
  UserOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';

interface Class {
  id: string;
  name: string;
  description?: string;
  code: string;
  status: string;
  studentCount: number;
  pendingCount: number;
  students: Array<{
    id: string;
    displayName: string;
    nickname?: string;
    school?: string;
    className?: string;
  }>;
  createdAt: string;
  inviteUrl: string;
}

interface PendingEnrollment {
  id: string;
  student: {
    id: string;
    displayName: string;
    nickname?: string;
    school?: string;
    className?: string;
    email: string;
  };
  requestedAt: string;
}

const ClassManagementPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [pendingModalVisible, setPendingModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [newClass, setNewClass] = useState({ name: '', description: '' });

  // 获取班级列表
  const fetchClasses = async () => {
    setLoading(true);
    try {
      // TODO: 调用 API 获取班级列表
      // const response = await api.get('/classes/my-classes');
      // setClasses(response.data);

      // 模拟数据
      setClasses([
        {
          id: '1',
          name: '初一(3)班',
          description: '编程入门班级',
          code: 'A1B2C3',
          status: 'ACTIVE',
          studentCount: 25,
          pendingCount: 3,
          students: [],
          createdAt: '2024-01-03T10:00:00Z',
          inviteUrl: '/classes/join/A1B2C3',
        },
      ]);
    } catch (error) {
      message.error('获取班级列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建班级
  const handleCreateClass = async () => {
    if (!newClass.name.trim()) {
      message.error('请输入班级名称');
      return;
    }

    try {
      // TODO: 调用 API 创建班级
      // const response = await api.post('/classes', newClass);
      // message.success('班级创建成功');
      // setCreateModalVisible(false);
      // setNewClass({ name: '', description: '' });
      // fetchClasses();

      message.success('班级创建成功（模拟）');
      setCreateModalVisible(false);
      setNewClass({ name: '', description: '' });
    } catch (error) {
      message.error('创建班级失败');
    }
  };

  // 复制邀请码
  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success('邀请码已复制到剪贴板');
  };

  // 查看待审批学生
  const viewPendingStudents = async (classInfo: Class) => {
    setSelectedClass(classInfo);
    setPendingModalVisible(true);

    try {
      // TODO: 调用 API 获取待审批学生
      // const response = await api.get(`/classes/${classInfo.id}/pending-enrollments`);
      // setPendingEnrollments(response.data);

      // 模拟数据
      setPendingEnrollments([
        {
          id: '1',
          student: {
            id: 's1',
            displayName: '小明',
            nickname: '小明',
            school: '北京市第一中学',
            className: '初一(3)班',
            email: 'xiaoming@example.com',
          },
          requestedAt: '2024-01-03T10:00:00Z',
        },
      ]);
    } catch (error) {
      message.error('获取待审批学生失败');
    }
  };

  // 审批学生入班
  const handleApproveEnrollment = async (enrollmentId: string, action: 'approve' | 'reject') => {
    try {
      // TODO: 调用 API 审批入班
      // await api.post(`/classes/enrollments/${enrollmentId}/approve`, { action });
      // message.success(action === 'approve' ? '已批准入班' : '已拒绝入班');
      // viewPendingStudents(selectedClass!);

      message.success(action === 'approve' ? '已批准入班（模拟）' : '已拒绝入班（模拟）');
    } catch (error) {
      message.error('审批失败');
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const columns = [
    {
      title: '班级名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '邀请码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Space>
          <code>{code}</code>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyInviteCode(code)}
          />
        </Space>
      ),
    },
    {
      title: '学生数量',
      dataIndex: 'studentCount',
      key: 'studentCount',
      render: (count: number) => (
        <Space>
          <UserOutlined />
          {count}
        </Space>
      ),
    },
    {
      title: '待审批',
      dataIndex: 'pendingCount',
      key: 'pendingCount',
      render: (count: number) =>
        count > 0 ? <Tag color="orange">{count}</Tag> : <Tag color="green">无</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? '活跃' : '已关闭'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Class) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => viewPendingStudents(record)}
            disabled={record.pendingCount === 0}
          >
            审批入班
          </Button>
          <Button size="small">编辑</Button>
        </Space>
      ),
    },
  ];

  const pendingColumns = [
    {
      title: '学生姓名',
      dataIndex: ['student', 'displayName'],
      key: 'studentName',
    },
    {
      title: '昵称',
      dataIndex: ['student', 'nickname'],
      key: 'nickname',
    },
    {
      title: '学校',
      dataIndex: ['student', 'school'],
      key: 'school',
    },
    {
      title: '班级',
      dataIndex: ['student', 'className'],
      key: 'className',
    },
    {
      title: '申请时间',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: PendingEnrollment) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleApproveEnrollment(record.id, 'approve')}
          >
            批准
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleApproveEnrollment(record.id, 'reject')}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>班级管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
          创建班级
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={classes}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* 创建班级模态框 */}
      <Modal
        title="创建班级"
        open={createModalVisible}
        onOk={handleCreateClass}
        onCancel={() => setCreateModalVisible(false)}
      >
        <div style={{ marginBottom: '16px' }}>
          <label>班级名称 *</label>
          <Input
            value={newClass.name}
            onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
            placeholder="请输入班级名称"
          />
        </div>
        <div>
          <label>班级描述</label>
          <Input.TextArea
            value={newClass.description}
            onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
            placeholder="请输入班级描述（可选）"
            rows={3}
          />
        </div>
      </Modal>

      {/* 待审批学生模态框 */}
      <Modal
        title={`${selectedClass?.name} - 待审批学生`}
        open={pendingModalVisible}
        onCancel={() => setPendingModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          columns={pendingColumns}
          dataSource={pendingEnrollments}
          rowKey="id"
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default ClassManagementPage;
