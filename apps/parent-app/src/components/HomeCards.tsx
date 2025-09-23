import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@kids/ui-kit';
import { httpClient } from '../services/http';

interface ChildData {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  progress: {
    xp: number;
    streakDays: number;
    completedCourses: number;
    totalCourses: number;
  };
  recentBadges: Array<{
    id: string;
    name: string;
    icon: string;
    earnedAt: string;
  }>;
  lastActiveAt: string;
  authorizationStatus: 'active' | 'pending' | 'expired' | 'none';
  authorizationExpiresAt?: string;
}

interface PendingRequest {
  id: string;
  studentEmail: string;
  purpose: string;
  reason: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function HomeCards() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [childrenRes, requestsRes] = await Promise.all([
        httpClient.get('/relationships/accessible-students'),
        httpClient.get('/relationships/pending-requests'),
      ]);
      
      setChildren(childrenRes);
      setPendingRequests(requestsRes.filter((req: PendingRequest) => req.status === 'pending'));
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getAuthorizationStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'expired': return 'danger';
      default: return 'info';
    }
  };

  const getAuthorizationStatusText = (status: string) => {
    switch (status) {
      case 'active': return '已授权';
      case 'pending': return '待审批';
      case 'expired': return '已过期';
      default: return '未授权';
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="home-cards">
      {/* 待审批数量卡片 */}
      {pendingRequests.length > 0 && (
        <Card heading="待处理申请" className="pending-requests-card">
          <div className="pending-requests">
            <div className="pending-count">
              <Badge text={`${pendingRequests.length} 个待处理`} tone="warning" />
            </div>
            <div className="pending-list">
              {pendingRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="pending-item">
                  <div className="request-info">
                    <h4>{request.studentEmail}</h4>
                    <p>{request.purpose} - {request.reason}</p>
                    <small>申请时间: {formatDate(request.createdAt)}</small>
                  </div>
                </div>
              ))}
              {pendingRequests.length > 3 && (
                <p className="more-requests">还有 {pendingRequests.length - 3} 个申请...</p>
              )}
            </div>
            <Button variant="primary" size="sm">
              查看全部申请
            </Button>
          </div>
        </Card>
      )}

      {/* 孩子列表卡片 */}
      <Card heading="我的孩子" className="children-list-card">
        {children.length === 0 ? (
          <div className="empty-state">
            <p>还没有绑定任何孩子</p>
            <Button variant="primary">
              申请查看孩子数据
            </Button>
          </div>
        ) : (
          <div className="children-list">
            {children.map((child) => (
              <div key={child.id} className="child-card">
                <div className="child-avatar">
                  {child.avatar ? (
                    <img src={child.avatar} alt={child.displayName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {child.displayName.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="child-info">
                  <h3>{child.displayName}</h3>
                  <p className="child-email">{child.email}</p>
                  
                  <div className="child-stats">
                    <div className="stat">
                      <span className="stat-label">经验值</span>
                      <span className="stat-value">{child.progress.xp}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">连续天数</span>
                      <span className="stat-value">{child.progress.streakDays}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">完成课程</span>
                      <span className="stat-value">
                        {child.progress.completedCourses}/{child.progress.totalCourses}
                      </span>
                    </div>
                  </div>

                  <div className="authorization-info">
                    <Badge
                      text={getAuthorizationStatusText(child.authorizationStatus)}
                      tone={getAuthorizationStatusColor(child.authorizationStatus)}
                    />
                    {child.authorizationExpiresAt && (
                      <small className="expires-at">
                        授权至: {formatDate(child.authorizationExpiresAt)}
                      </small>
                    )}
                  </div>

                  <div className="recent-badges">
                    {child.recentBadges.slice(0, 3).map((badge) => (
                      <div key={badge.id} className="badge-item">
                        <span className="badge-icon">{badge.icon}</span>
                        <span className="badge-name">{badge.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="last-active">
                    <small>最后活跃: {formatDate(child.lastActiveAt)}</small>
                  </div>
                </div>

                <div className="child-actions">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={child.authorizationStatus !== 'active'}
                  >
                    查看详情
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    管理授权
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 快速操作卡片 */}
      <Card heading="快速操作" className="quick-actions-card">
        <div className="quick-actions">
          <Button variant="primary" className="action-button">
            <span className="action-icon">👨‍👩‍👧‍👦</span>
            <span>申请查看新孩子</span>
          </Button>
          <Button variant="secondary" className="action-button">
            <span className="action-icon">📊</span>
            <span>查看学习报告</span>
          </Button>
          <Button variant="secondary" className="action-button">
            <span className="action-icon">⚙️</span>
            <span>授权管理</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
