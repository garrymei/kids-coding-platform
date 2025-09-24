# 前端组件实现文档

## 概述

本文档提供了前端交互功能的具体实现指导，包括组件实现、状态管理、API集成等关键技术细节。

## 技术栈

### 1. 前端框架

- **React 18+**: 主要UI框架
- **TypeScript**: 类型安全
- **Ant Design**: UI组件库
- **Recharts**: 图表库

### 2. 状态管理

- **Zustand**: 轻量级状态管理
- **React Query**: 服务端状态管理
- **React Hook Form**: 表单管理

### 3. 工具库

- **dayjs**: 日期处理
- **lodash**: 工具函数
- **axios**: HTTP客户端

---

## 核心组件实现

### 1. 学生端授权中心组件

#### 1.1 主容器组件

```typescript
// apps/student-app/src/pages/AuthorizationCenterPage.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, Card, Button, Modal, message, Spin } from 'antd';
import { PermissionScopeSelector, StatusIndicator, RequestCard } from '@kids/ui-kit';
import { useAuthorizationStore } from '../stores/authorizationStore';
import { useAuthStore } from '../stores/authStore';

const { TabPane } = Tabs;

interface AuthorizationCenterPageProps {}

const AuthorizationCenterPage: React.FC<AuthorizationCenterPageProps> = () => {
  const { user } = useAuthStore();
  const {
    pendingRequests,
    activeRelationships,
    revokedRelationships,
    loading,
    fetchPendingRequests,
    fetchActiveRelationships,
    fetchRevokedRelationships,
    approveRequest,
    rejectRequest,
    revokeRelationship,
    modifyRelationship,
  } = useAuthorizationStore();

  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPendingRequests(user.id);
      fetchActiveRelationships(user.id);
      fetchRevokedRelationships(user.id);
    }
  }, [user?.id]);

  const handleApproveRequest = async (requestId: string, scope: string[], expiresAt: string) => {
    try {
      await approveRequest(requestId, { scope, expiresAt });
      message.success('申请已同意');
      setShowDetailModal(false);
      // 刷新数据
      fetchPendingRequests(user.id);
      fetchActiveRelationships(user.id);
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      await rejectRequest(requestId, reason);
      message.success('申请已拒绝');
      setShowDetailModal(false);
      fetchPendingRequests(user.id);
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  const handleRevokeRelationship = async (relationshipId: string) => {
    try {
      await revokeRelationship(relationshipId);
      message.success('授权已撤销');
      fetchActiveRelationships(user.id);
      fetchRevokedRelationships(user.id);
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  const handleModifyRelationship = async (relationshipId: string, scope: string[], expiresAt: string) => {
    try {
      await modifyRelationship(relationshipId, { scope, expiresAt });
      message.success('权限已修改');
      setShowModifyModal(false);
      fetchActiveRelationships(user.id);
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  return (
    <div className="authorization-center-page">
      <div className="page-header">
        <h1>授权中心</h1>
        <div className="header-actions">
          <Button type="link">设置</Button>
          <Button type="link">帮助</Button>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={`待处理 (${pendingRequests.length})`} key="pending">
          <Spin spinning={loading}>
            <div className="request-list">
              {pendingRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onViewDetails={() => {
                    setSelectedRequest(request);
                    setShowDetailModal(true);
                  }}
                  onApprove={() => handleApproveRequest(request.id, request.requestScope, request.expiresAt)}
                  onReject={() => handleRejectRequest(request.id, '')}
                />
              ))}
            </div>
          </Spin>
        </TabPane>

        <TabPane tab={`已授权 (${activeRelationships.length})`} key="active">
          <Spin spinning={loading}>
            <div className="relationship-list">
              {activeRelationships.map((relationship) => (
                <RequestCard
                  key={relationship.id}
                  request={relationship}
                  onViewDetails={() => {
                    setSelectedRequest(relationship);
                    setShowDetailModal(true);
                  }}
                  onModify={() => {
                    setSelectedRequest(relationship);
                    setShowModifyModal(true);
                  }}
                  onRevoke={() => handleRevokeRelationship(relationship.id)}
                />
              ))}
            </div>
          </Spin>
        </TabPane>

        <TabPane tab={`已撤销 (${revokedRelationships.length})`} key="revoked">
          <Spin spinning={loading}>
            <div className="relationship-list">
              {revokedRelationships.map((relationship) => (
                <RequestCard
                  key={relationship.id}
                  request={relationship}
                  onViewDetails={() => {
                    setSelectedRequest(relationship);
                    setShowDetailModal(true);
                  }}
                />
              ))}
            </div>
          </Spin>
        </TabPane>
      </Tabs>

      {/* 详情模态框 */}
      <RequestDetailModal
        visible={showDetailModal}
        request={selectedRequest}
        onClose={() => setShowDetailModal(false)}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
      />

      {/* 修改权限模态框 */}
      <ModifyPermissionModal
        visible={showModifyModal}
        relationship={selectedRequest}
        onClose={() => setShowModifyModal(false)}
        onModify={handleModifyRelationship}
      />
    </div>
  );
};

export default AuthorizationCenterPage;
```

#### 1.2 状态管理Store

```typescript
// apps/student-app/src/stores/authorizationStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { authorizationApi } from '../api/authorizationApi';

interface PendingRequest {
  id: string;
  applicantName: string;
  applicantRole: 'parent' | 'teacher';
  requestScope: string[];
  requestTime: string;
  expiresAt: string;
  status: 'pending';
}

interface ActiveRelationship {
  id: string;
  partyName: string;
  partyRole: 'parent' | 'teacher';
  grantedScope: string[];
  grantedAt: string;
  expiresAt: string;
  status: 'active';
}

interface RevokedRelationship {
  id: string;
  partyName: string;
  partyRole: 'parent' | 'teacher';
  grantedScope: string[];
  grantedAt: string;
  revokedAt: string;
  status: 'revoked';
}

interface AuthorizationState {
  pendingRequests: PendingRequest[];
  activeRelationships: ActiveRelationship[];
  revokedRelationships: RevokedRelationship[];
  loading: boolean;
  error: string | null;
}

interface AuthorizationActions {
  fetchPendingRequests: (studentId: string) => Promise<void>;
  fetchActiveRelationships: (studentId: string) => Promise<void>;
  fetchRevokedRelationships: (studentId: string) => Promise<void>;
  approveRequest: (
    requestId: string,
    data: { scope: string[]; expiresAt: string },
  ) => Promise<void>;
  rejectRequest: (requestId: string, reason: string) => Promise<void>;
  revokeRelationship: (relationshipId: string) => Promise<void>;
  modifyRelationship: (
    relationshipId: string,
    data: { scope: string[]; expiresAt: string },
  ) => Promise<void>;
  clearError: () => void;
}

export const useAuthorizationStore = create<AuthorizationState & AuthorizationActions>()(
  devtools(
    (set, get) => ({
      // 初始状态
      pendingRequests: [],
      activeRelationships: [],
      revokedRelationships: [],
      loading: false,
      error: null,

      // 获取待处理申请
      fetchPendingRequests: async (studentId: string) => {
        set({ loading: true, error: null });
        try {
          const requests = await authorizationApi.getPendingRequests(studentId);
          set({ pendingRequests: requests, loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // 获取已授权关系
      fetchActiveRelationships: async (studentId: string) => {
        set({ loading: true, error: null });
        try {
          const relationships = await authorizationApi.getActiveRelationships(studentId);
          set({ activeRelationships: relationships, loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // 获取已撤销关系
      fetchRevokedRelationships: async (studentId: string) => {
        set({ loading: true, error: null });
        try {
          const relationships = await authorizationApi.getRevokedRelationships(studentId);
          set({ revokedRelationships: relationships, loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // 同意申请
      approveRequest: async (requestId: string, data: { scope: string[]; expiresAt: string }) => {
        set({ loading: true, error: null });
        try {
          await authorizationApi.approveRequest(requestId, data);
          set({ loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // 拒绝申请
      rejectRequest: async (requestId: string, reason: string) => {
        set({ loading: true, error: null });
        try {
          await authorizationApi.rejectRequest(requestId, reason);
          set({ loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // 撤销关系
      revokeRelationship: async (relationshipId: string) => {
        set({ loading: true, error: null });
        try {
          await authorizationApi.revokeRelationship(relationshipId);
          set({ loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // 修改关系
      modifyRelationship: async (
        relationshipId: string,
        data: { scope: string[]; expiresAt: string },
      ) => {
        set({ loading: true, error: null });
        try {
          await authorizationApi.modifyRelationship(relationshipId, data);
          set({ loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // 清除错误
      clearError: () => set({ error: null }),
    }),
    { name: 'authorization-store' },
  ),
);
```

### 2. 家长端关注学生组件

#### 2.1 搜索学生页面

```typescript
// apps/parent-app/src/pages/SearchStudentsPage.tsx
import React, { useState } from 'react';
import { Card, Input, Button, Radio, message, Spin, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useSearchStore } from '../stores/searchStore';
import { useAuthStore } from '../stores/authStore';

const { Search } = Input;

interface SearchStudentsPageProps {}

const SearchStudentsPage: React.FC<SearchStudentsPageProps> = () => {
  const { user } = useAuthStore();
  const { searchResults, loading, searchStudents } = useSearchStore();

  const [searchMode, setSearchMode] = useState<'name' | 'id'>('name');
  const [searchForm, setSearchForm] = useState({
    nickname: '',
    school: '',
    anonymousId: '',
  });

  const handleSearch = async () => {
    if (searchMode === 'name') {
      if (!searchForm.nickname || !searchForm.school) {
        message.warning('请填写昵称和学校信息');
        return;
      }
      await searchStudents({
        type: 'name',
        nickname: searchForm.nickname,
        school: searchForm.school,
      });
    } else {
      if (!searchForm.anonymousId) {
        message.warning('请填写匿名ID');
        return;
      }
      await searchStudents({
        type: 'id',
        anonymousId: searchForm.anonymousId,
      });
    }
  };

  const handleRequestFollow = (studentId: string) => {
    // 跳转到申请关注页面
    window.location.href = `/parent/request-follow/${studentId}`;
  };

  return (
    <div className="search-students-page">
      <div className="page-header">
        <h1>关注学生</h1>
        <Button type="link">返回</Button>
      </div>

      <Card title="搜索学生" className="search-card">
        <div className="search-form">
          <div className="search-mode">
            <Radio.Group value={searchMode} onChange={(e) => setSearchMode(e.target.value)}>
              <Radio value="name">昵称 + 学校</Radio>
              <Radio value="id">匿名ID</Radio>
            </Radio.Group>
          </div>

          {searchMode === 'name' ? (
            <div className="search-fields">
              <div className="field-group">
                <label>昵称:</label>
                <Input
                  placeholder="请输入学生昵称"
                  value={searchForm.nickname}
                  onChange={(e) => setSearchForm({ ...searchForm, nickname: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label>学校:</label>
                <Input
                  placeholder="请输入学校名称"
                  value={searchForm.school}
                  onChange={(e) => setSearchForm({ ...searchForm, school: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="search-fields">
              <div className="field-group">
                <label>匿名ID:</label>
                <Input
                  placeholder="请输入匿名ID，如: S-8F3K2Q"
                  value={searchForm.anonymousId}
                  onChange={(e) => setSearchForm({ ...searchForm, anonymousId: e.target.value })}
                />
              </div>
            </div>
          )}

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
            className="search-button"
          >
            搜索
          </Button>
        </div>
      </Card>

      {searchResults.length > 0 && (
        <Card title={`搜索结果 (${searchResults.length})`} className="results-card">
          <Spin spinning={loading}>
            <div className="search-results">
              {searchResults.map((student) => (
                <div key={student.id} className="student-card">
                  <div className="student-info">
                    <div className="student-name">{student.nickname}</div>
                    <div className="student-details">
                      <div>学校: {student.school}</div>
                      <div>班级: {student.className}</div>
                      <div>匿名ID: {student.anonymousId}</div>
                    </div>
                  </div>
                  <div className="student-actions">
                    <Button
                      type="primary"
                      onClick={() => handleRequestFollow(student.id)}
                    >
                      申请关注
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Spin>
        </Card>
      )}

      {!loading && searchResults.length === 0 && (
        <Card>
          <Empty description="未找到匹配的学生" />
        </Card>
      )}
    </div>
  );
};

export default SearchStudentsPage;
```

#### 2.2 申请关注页面

```typescript
// apps/parent-app/src/pages/RequestFollowPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, Button, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { PermissionScopeSelector, ExpiryTimeSelector } from '@kids/ui-kit';
import { useFollowStore } from '../stores/followStore';
import { useAuthStore } from '../stores/authStore';

interface RequestFollowPageProps {}

const RequestFollowPage: React.FC<RequestFollowPageProps> = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { studentInfo, loading, requestFollow } = useFollowStore();

  const [requestForm, setRequestForm] = useState({
    scope: ['progress', 'completion'],
    expiresAt: null as string | null,
    reason: '',
  });

  useEffect(() => {
    if (studentId) {
      // 获取学生信息
      // fetchStudentInfo(studentId);
    }
  }, [studentId]);

  const handleSubmit = async () => {
    if (!requestForm.reason.trim()) {
      message.warning('请填写申请原因');
      return;
    }

    try {
      await requestFollow({
        studentId: studentId!,
        scope: requestForm.scope,
        expiresAt: requestForm.expiresAt,
        reason: requestForm.reason,
      });
      message.success('申请已发送，等待学生审批');
      navigate('/parent/waiting-approval');
    } catch (error) {
      message.error('申请发送失败，请重试');
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div className="request-follow-page">
      <div className="page-header">
        <h1>申请关注学生</h1>
        <Button type="link" onClick={() => navigate(-1)}>返回</Button>
      </div>

      <Card title="学生信息" className="student-info-card">
        <div className="student-details">
          <div className="student-name">{studentInfo?.nickname}</div>
          <div className="student-school">{studentInfo?.school}</div>
          <div className="student-class">{studentInfo?.className}</div>
        </div>
      </Card>

      <Card title="申请信息" className="request-form-card">
        <div className="form-section">
          <h3>申请范围</h3>
          <PermissionScopeSelector
            scopes={['progress', 'completion', 'code_content', 'time_records']}
            selected={requestForm.scope}
            onChange={(scope) => setRequestForm({ ...requestForm, scope })}
            showDescription={true}
          />
        </div>

        <div className="form-section">
          <h3>到期时间</h3>
          <ExpiryTimeSelector
            value={requestForm.expiresAt}
            onChange={(expiresAt) => setRequestForm({ ...requestForm, expiresAt })}
          />
        </div>

        <div className="form-section">
          <h3>申请原因</h3>
          <textarea
            className="reason-input"
            placeholder="请说明申请关注的原因..."
            value={requestForm.reason}
            onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
            rows={4}
          />
        </div>

        <div className="form-actions">
          <Button onClick={() => navigate(-1)}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>
            发送申请
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default RequestFollowPage;
```

### 3. 教师端班级管理组件

#### 3.1 班级管理页面

```typescript
// apps/teacher-app/src/pages/ClassManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, message, Modal, Input, Form } from 'antd';
import { PlusOutlined, CopyOutlined, UserOutlined } from '@ant-design/icons';
import { useClassStore } from '../stores/classStore';
import { useAuthStore } from '../stores/authStore';

const { TextArea } = Input;

interface ClassManagementPageProps {}

const ClassManagementPage: React.FC<ClassManagementPageProps> = () => {
  const { user } = useAuthStore();
  const {
    classes,
    pendingEnrollments,
    loading,
    fetchClasses,
    fetchPendingEnrollments,
    createClass,
    approveEnrollment,
    rejectEnrollment,
  } = useClassStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm] = Form.useForm();

  useEffect(() => {
    if (user?.id) {
      fetchClasses(user.id);
      fetchPendingEnrollments(user.id);
    }
  }, [user?.id]);

  const handleCreateClass = async (values: any) => {
    try {
      await createClass({
        name: values.name,
        description: values.description,
        ownerTeacherId: user?.id!,
      });
      message.success('班级创建成功');
      setShowCreateModal(false);
      createForm.resetFields();
      fetchClasses(user?.id!);
    } catch (error) {
      message.error('创建失败，请重试');
    }
  };

  const handleApproveEnrollment = async (enrollmentId: string) => {
    try {
      await approveEnrollment(enrollmentId);
      message.success('申请已同意');
      fetchPendingEnrollments(user?.id!);
      fetchClasses(user?.id!);
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  const handleRejectEnrollment = async (enrollmentId: string) => {
    try {
      await rejectEnrollment(enrollmentId);
      message.success('申请已拒绝');
      fetchPendingEnrollments(user?.id!);
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success('邀请码已复制');
  };

  const classColumns = [
    {
      title: '班级名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '学生数量',
      dataIndex: 'studentCount',
      key: 'studentCount',
      render: (count: number) => `${count}人`,
    },
    {
      title: '邀请码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <div className="invite-code">
          <span className="code-text">{code}</span>
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={() => copyInviteCode(code)}
          >
            复制
          </Button>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: any) => (
        <div className="class-actions">
          <Button type="link" size="small">管理班级</Button>
          <Button type="link" size="small">查看详情</Button>
        </div>
      ),
    },
  ];

  const enrollmentColumns = [
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
    },
    {
      title: '申请时间',
      dataIndex: 'requestTime',
      key: 'requestTime',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '申请原因',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'pending' ? 'orange' : 'green'}>
          {status === 'pending' ? '待审批' : '已通过'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: any) => (
        <div className="enrollment-actions">
          <Button
            type="primary"
            size="small"
            onClick={() => handleApproveEnrollment(record.id)}
          >
            同意
          </Button>
          <Button
            size="small"
            onClick={() => handleRejectEnrollment(record.id)}
          >
            拒绝
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="class-management-page">
      <div className="page-header">
        <h1>班级管理</h1>
        <Button type="link">返回</Button>
      </div>

      <Card title="我的班级" className="classes-card">
        <div className="card-header">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateModal(true)}
          >
            创建新班级
          </Button>
        </div>
        <Table
          columns={classColumns}
          dataSource={classes}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Card title={`待审批申请 (${pendingEnrollments.length})`} className="enrollments-card">
        <Table
          columns={enrollmentColumns}
          dataSource={pendingEnrollments}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* 创建班级模态框 */}
      <Modal
        title="创建新班级"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateClass}
        >
          <Form.Item
            name="name"
            label="班级名称"
            rules={[{ required: true, message: '请输入班级名称' }]}
          >
            <Input placeholder="如: 初一(4)班" />
          </Form.Item>

          <Form.Item
            name="description"
            label="班级描述"
          >
            <TextArea
              placeholder="新学期的编程入门班级"
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <div className="form-actions">
              <Button onClick={() => setShowCreateModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建班级</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassManagementPage;
```

---

## API集成

### 1. 授权相关API

```typescript
// apps/student-app/src/api/authorizationApi.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const authorizationApi = {
  // 获取待处理申请
  getPendingRequests: async (studentId: string) => {
    const response = await axios.get(`${API_BASE_URL}/consents/pending`, {
      params: { studentId },
    });
    return response.data;
  },

  // 获取已授权关系
  getActiveRelationships: async (studentId: string) => {
    const response = await axios.get(`${API_BASE_URL}/relationships/active`, {
      params: { studentId },
    });
    return response.data;
  },

  // 获取已撤销关系
  getRevokedRelationships: async (studentId: string) => {
    const response = await axios.get(`${API_BASE_URL}/relationships/revoked`, {
      params: { studentId },
    });
    return response.data;
  },

  // 同意申请
  approveRequest: async (requestId: string, data: { scope: string[]; expiresAt: string }) => {
    const response = await axios.post(`${API_BASE_URL}/consents/${requestId}/approve`, data);
    return response.data;
  },

  // 拒绝申请
  rejectRequest: async (requestId: string, reason: string) => {
    const response = await axios.post(`${API_BASE_URL}/consents/${requestId}/reject`, { reason });
    return response.data;
  },

  // 撤销关系
  revokeRelationship: async (relationshipId: string) => {
    const response = await axios.post(`${API_BASE_URL}/relationships/${relationshipId}/revoke`);
    return response.data;
  },

  // 修改关系
  modifyRelationship: async (
    relationshipId: string,
    data: { scope: string[]; expiresAt: string },
  ) => {
    const response = await axios.put(`${API_BASE_URL}/relationships/${relationshipId}`, data);
    return response.data;
  },
};
```

### 2. 搜索相关API

```typescript
// apps/parent-app/src/api/searchApi.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const searchApi = {
  // 搜索学生
  searchStudents: async (params: {
    type: 'name' | 'id';
    nickname?: string;
    school?: string;
    anonymousId?: string;
  }) => {
    const response = await axios.get(`${API_BASE_URL}/relationships/search-students`, {
      params,
    });
    return response.data;
  },

  // 申请关注
  requestFollow: async (data: {
    studentId: string;
    scope: string[];
    expiresAt: string | null;
    reason: string;
  }) => {
    const response = await axios.post(`${API_BASE_URL}/relationships/requests`, data);
    return response.data;
  },
};
```

### 3. 班级管理API

```typescript
// apps/teacher-app/src/api/classApi.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const classApi = {
  // 获取教师班级
  getClasses: async (teacherId: string) => {
    const response = await axios.get(`${API_BASE_URL}/classes/teacher/${teacherId}`);
    return response.data;
  },

  // 创建班级
  createClass: async (data: { name: string; description?: string; ownerTeacherId: string }) => {
    const response = await axios.post(`${API_BASE_URL}/classes`, data);
    return response.data;
  },

  // 获取待审批申请
  getPendingEnrollments: async (teacherId: string) => {
    const response = await axios.get(`${API_BASE_URL}/classes/enrollments/pending`, {
      params: { teacherId },
    });
    return response.data;
  },

  // 审批学生申请
  approveEnrollment: async (enrollmentId: string) => {
    const response = await axios.post(
      `${API_BASE_URL}/classes/enrollments/${enrollmentId}/approve`,
    );
    return response.data;
  },

  // 拒绝学生申请
  rejectEnrollment: async (enrollmentId: string) => {
    const response = await axios.post(`${API_BASE_URL}/classes/enrollments/${enrollmentId}/reject`);
    return response.data;
  },
};
```

---

## 样式实现

### 1. 全局样式

```css
/* apps/student-app/src/styles/authorization-center.css */
.authorization-center-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.authorization-center-page .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.authorization-center-page .page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.authorization-center-page .page-header .header-actions {
  display: flex;
  gap: 8px;
}

.authorization-center-page .request-list,
.authorization-center-page .relationship-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .authorization-center-page {
    padding: 16px;
  }

  .authorization-center-page .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
```

### 2. 组件样式

```css
/* packages/ui-kit/src/components/RequestCard.css */
.request-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.request-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-primary);
}

.request-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.request-card .applicant-info {
  flex: 1;
}

.request-card .applicant-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.request-card .applicant-role {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: 2px var(--spacing-xs);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  display: inline-block;
}

.request-card .card-content {
  margin-bottom: var(--spacing-lg);
}

.request-card .scope-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.request-card .scope-tag {
  padding: 2px var(--spacing-xs);
  background: rgba(24, 144, 255, 0.1);
  color: var(--primary-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
}

.request-card .time-info {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.request-card .card-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .request-card {
    padding: var(--spacing-md);
  }

  .request-card .card-actions {
    flex-direction: column;
  }

  .request-card .action-button {
    width: 100%;
    justify-content: center;
  }
}
```

---

## 测试策略

### 1. 单元测试

```typescript
// apps/student-app/src/components/__tests__/RequestCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequestCard } from '../RequestCard';

const mockRequest = {
  id: '1',
  applicantName: '张妈妈',
  applicantRole: 'parent' as const,
  requestScope: ['progress', 'completion'],
  requestTime: '2024-01-03T14:30:00Z',
  expiresAt: '2024-04-03',
  status: 'pending' as const,
};

describe('RequestCard', () => {
  it('renders request information correctly', () => {
    render(
      <RequestCard
        request={mockRequest}
        onViewDetails={jest.fn()}
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />
    );

    expect(screen.getByText('张妈妈')).toBeInTheDocument();
    expect(screen.getByText('家长')).toBeInTheDocument();
    expect(screen.getByText('学习进度')).toBeInTheDocument();
    expect(screen.getByText('完成情况')).toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', () => {
    const mockOnApprove = jest.fn();
    render(
      <RequestCard
        request={mockRequest}
        onViewDetails={jest.fn()}
        onApprove={mockOnApprove}
        onReject={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('同意'));
    expect(mockOnApprove).toHaveBeenCalledWith(mockRequest.id);
  });
});
```

### 2. 集成测试

```typescript
// apps/student-app/src/pages/__tests__/AuthorizationCenterPage.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthorizationCenterPage } from '../AuthorizationCenterPage';
import { useAuthorizationStore } from '../../stores/authorizationStore';

// Mock the store
jest.mock('../../stores/authorizationStore');
const mockUseAuthorizationStore = useAuthorizationStore as jest.MockedFunction<typeof useAuthorizationStore>;

describe('AuthorizationCenterPage', () => {
  beforeEach(() => {
    mockUseAuthorizationStore.mockReturnValue({
      pendingRequests: [],
      activeRelationships: [],
      revokedRelationships: [],
      loading: false,
      error: null,
      fetchPendingRequests: jest.fn(),
      fetchActiveRelationships: jest.fn(),
      fetchRevokedRelationships: jest.fn(),
      approveRequest: jest.fn(),
      rejectRequest: jest.fn(),
      revokeRelationship: jest.fn(),
      modifyRelationship: jest.fn(),
      clearError: jest.fn(),
    });
  });

  it('renders authorization center page', () => {
    render(
      <BrowserRouter>
        <AuthorizationCenterPage />
      </BrowserRouter>
    );

    expect(screen.getByText('授权中心')).toBeInTheDocument();
    expect(screen.getByText('待处理 (0)')).toBeInTheDocument();
    expect(screen.getByText('已授权 (0)')).toBeInTheDocument();
    expect(screen.getByText('已撤销 (0)')).toBeInTheDocument();
  });
});
```

---

**文档版本**: v1.0  
**最后更新**: 2024-01-03  
**维护人员**: 开发团队
