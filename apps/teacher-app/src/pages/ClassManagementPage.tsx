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

  const fetchClasses = async () => {
    setLoading(true);
    try {
      setClasses([
        {
          id: '1',
          name: '初一（3）班',
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

  useEffect(() => {
    void fetchClasses();
  }, []);

  const handleCreateClass = async () => {
    if (!newClass.name.trim()) {
      message.error('请输入班级名称');
      return;
    }

    try {
      message.success('班级创建成功（模拟）');
      setCreateModalVisible(false);
      setNewClass({ name: '', description: '' });
    } catch (error) {
      message.error('创建班级失败');
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      message.success('邀请码已复制到剪贴板');
    });
  };

  const viewPendingStudents = async (classInfo: Class) => {
    setSelectedClass(classInfo);
    setPendingModalVisible(true);

    try {
      setPendingEnrollments([
        {
          id: '1',
          student: {
            id: 's1',
            displayName: '小明',
            nickname: '明明',
            school: '第一小学',
            className: '四年级',
            email: 'stu1@example.com',
          },
          requestedAt: new Date().toISOString(),
        },
        {
          id: '2',
          student: {
            id: 's2',
            displayName: '小红',
            nickname: '红豆',
            school: '第二小学',
            className: '四年级',
            email: 'stu2@example.com',
          },
          requestedAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      message.error('获取待审批学生失败');
    }
  };

  const handleApproveEnrollment = async (enrollmentId: string, action: 'approve' | 'reject') => {
    try {
      console.log('handle enrollment', enrollmentId, action);
    } catch (error) {
      message.error('审批失败，请稍后再试');
    }
  };

  const columns = [
    {
      title: '班级名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '班级简介',
      dataIndex: 'description',
      key: 'description',
      render: (text: string | undefined) => text ?? '暂无简介',
    },
    {
      title: '班级状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'gray'}>{status === 'ACTIVE' ? '进行中' : '停用'}</Tag>
      ),
    },
    {
      title: '学生人数',
      dataIndex: 'studentCount',
      key: 'studentCount',
    },
    {
      title: '待审批',
      dataIndex: 'pendingCount',
      key: 'pendingCount',
      render: (count: number) => <Tag color={count > 0 ? 'orange' : 'default'}>{count}</Tag>,
    },
    {
      title: '邀请码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string, record: Class) => (
        <Space>
          <span>{code}</span>
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyInviteCode(record.inviteUrl)}>
            复制链接
          </Button>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Class) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => viewPendingStudents(record)}
          >
            待审批 ({record.pendingCount})
          </Button>
          <Button size="small">管理班级</Button>
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
      render: (text: string | undefined) => text ?? '-',
    },
    {
      title: '学校',
      dataIndex: ['student', 'school'],
      key: 'school',
      render: (text: string | undefined) => text ?? '-',
    },
    {
      title: '班级',
      dataIndex: ['student', 'className'],
      key: 'className',
      render: (text: string | undefined) => text ?? '-',
    },
    {
      title: '申请时间',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: PendingEnrollment) => (
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
            onChange={(event) => setNewClass({ ...newClass, name: event.target.value })}
            placeholder="请输入班级名称"
          />
        </div>
        <div>
          <label>班级简介</label>
          <Input.TextArea
            value={newClass.description}
            onChange={(event) => setNewClass({ ...newClass, description: event.target.value })}
            placeholder="可选：简要描述课程目标"
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        title={`${selectedClass?.name ?? ''} - 待审批学生`}
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

export { ClassManagementPage };
export default ClassManagementPage;