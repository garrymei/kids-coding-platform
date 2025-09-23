import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Progress } from '@kids/ui-kit';
import { useFormValidation, FormField, FormSelect, FormCheckbox } from '@kids/forms';
import { httpClient } from '../services/http';
import { z } from 'zod';

// 待审批请求的 schema
const pendingRequestSchema = z.object({
  id: z.string(),
  requester: z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.string(),
    role: z.object({
      name: z.string(),
    }),
  }),
  purpose: z.string(),
  reason: z.string(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
});

// 已授权关系的 schema
const authorizedRelationshipSchema = z.object({
  id: z.string(),
  party: z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.string(),
    role: z.object({
      name: z.string(),
    }),
  }),
  status: z.string(),
  accessGrants: z.array(z.object({
    id: z.string(),
    scope: z.array(z.string()),
    status: z.string(),
    expiresAt: z.string().nullable(),
  })),
  createdAt: z.string(),
});

// 已撤销关系的 schema
const revokedRelationshipSchema = z.object({
  id: z.string(),
  party: z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.string(),
    role: z.object({
      name: z.string(),
    }),
  }),
  status: z.string(),
  revokedAt: z.string(),
  reason: z.string().optional(),
});

type PendingRequest = z.infer<typeof pendingRequestSchema>;
type AuthorizedRelationship = z.infer<typeof authorizedRelationshipSchema>;
type RevokedRelationship = z.infer<typeof revokedRelationshipSchema>;

const scopeOptions = [
  { value: 'progress:read', label: '查看学习进度' },
  { value: 'works:read', label: '查看作品' },
  { value: 'badges:read', label: '查看徽章' },
  { value: 'courses:read', label: '查看课程' },
];

const durationOptions = [
  { value: '1h', label: '1小时' },
  { value: '1d', label: '1天' },
  { value: '1w', label: '1周' },
  { value: '1m', label: '1个月' },
  { value: '3m', label: '3个月' },
  { value: '1y', label: '1年' },
  { value: 'never', label: '永久' },
];

export function AuthorizationCenterPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'authorized' | 'revoked'>('pending');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [authorizedRelationships, setAuthorizedRelationships] = useState<AuthorizedRelationship[]>([]);
  const [revokedRelationships, setRevokedRelationships] = useState<RevokedRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);

  // 响应表单
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useFormValidation({
    schema: z.object({
      status: z.enum(['APPROVED', 'REJECTED']),
      scopes: z.array(z.string()).optional(),
      duration: z.string().optional(),
    }),
    defaultValues: {
      status: 'APPROVED',
      scopes: ['progress:read'],
      duration: '1m',
    },
  });

  const selectedScopes = watch('scopes') || [];
  const selectedDuration = watch('duration');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsRes, relationshipsRes, revokedRes] = await Promise.all([
        httpClient.get('/relationships/pending-requests'),
        httpClient.get('/relationships/my-relationships'),
        httpClient.get('/relationships/revoked-relationships'),
      ]);
      
      setPendingRequests(requestsRes);
      setAuthorizedRelationships(relationshipsRes.filter((r: any) => r.status === 'ACTIVE'));
      setRevokedRelationships(revokedRes);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseRequest = (request: PendingRequest) => {
    setSelectedRequest(request);
    setShowResponseForm(true);
  };

  const onSubmitResponse = async (data: any) => {
    if (!selectedRequest) return;

    try {
      const expiresAt = data.duration === 'never' 
        ? null 
        : new Date(Date.now() + getDurationMs(data.duration)).toISOString();

      await httpClient.post('/relationships/respond-to-request', {
        consentId: selectedRequest.id,
        status: data.status,
        scopes: data.status === 'APPROVED' ? data.scopes : undefined,
        expiresAt,
      });

      setShowResponseForm(false);
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      console.error('响应请求失败:', error);
    }
  };

  const handleRevokeRelationship = async (relationshipId: string) => {
    if (!confirm('确定要撤销此授权吗？')) return;

    try {
      await httpClient.put(`/relationships/relationships/${relationshipId}`, {
        status: 'REVOKED',
      });
      loadData();
    } catch (error) {
      console.error('撤销授权失败:', error);
    }
  };

  const handleUpdateAccessGrant = async (grantId: string, scopes: string[]) => {
    try {
      await httpClient.put(`/relationships/access-grants/${grantId}`, {
        scopes,
      });
      loadData();
    } catch (error) {
      console.error('更新授权失败:', error);
    }
  };

  const getDurationMs = (duration: string) => {
    switch (duration) {
      case '1h': return 60 * 60 * 1000;
      case '1d': return 24 * 60 * 60 * 1000;
      case '1w': return 7 * 24 * 60 * 60 * 1000;
      case '1m': return 30 * 24 * 60 * 60 * 1000;
      case '3m': return 90 * 24 * 60 * 60 * 1000;
      case '1y': return 365 * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'parent': return '家长';
      case 'teacher': return '教师';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'REVOKED': return 'danger';
      case 'EXPIRED': return 'danger';
      default: return 'info';
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'progress:read': return '学习进度';
      case 'works:read': return '作品查看';
      case 'badges:read': return '徽章查看';
      case 'courses:read': return '课程查看';
      default: return scope;
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="authorization-center-page">
      <div className="page-header">
        <h1>授权管理中心</h1>
        <p>管理谁可以查看您的学习数据</p>
      </div>

      {/* 标签页导航 */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          待审批 ({pendingRequests.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'authorized' ? 'active' : ''}`}
          onClick={() => setActiveTab('authorized')}
        >
          已授权 ({authorizedRelationships.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'revoked' ? 'active' : ''}`}
          onClick={() => setActiveTab('revoked')}
        >
          已撤销 ({revokedRelationships.length})
        </button>
      </div>

      {/* 待审批请求 */}
      {activeTab === 'pending' && (
        <Card heading="待处理的访问请求">
          {pendingRequests.length === 0 ? (
            <div className="empty-state">
              <p>暂无待处理的请求</p>
            </div>
          ) : (
            <div className="request-list">
              {pendingRequests.map((request) => (
                <div key={request.id} className="request-item">
                  <div className="request-info">
                    <h3>{request.requester.displayName}</h3>
                    <p>{getRoleLabel(request.requester.role.name)} • {request.requester.email}</p>
                    <p><strong>申请目的:</strong> {request.purpose}</p>
                    <p><strong>申请理由:</strong> {request.reason}</p>
                    <p><strong>申请时间:</strong> {formatDate(request.createdAt)}</p>
                  </div>
                  <div className="request-actions">
                    <Button
                      variant="primary"
                      onClick={() => handleResponseRequest(request)}
                    >
                      处理请求
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 已授权关系 */}
      {activeTab === 'authorized' && (
        <Card heading="已授权的关系">
          {authorizedRelationships.length === 0 ? (
            <div className="empty-state">
              <p>暂无授权关系</p>
            </div>
          ) : (
            <div className="relationship-list">
              {authorizedRelationships.map((relationship) => (
                <div key={relationship.id} className="relationship-item">
                  <div className="relationship-info">
                    <h3>{relationship.party.displayName}</h3>
                    <p>{getRoleLabel(relationship.party.role.name)} • {relationship.party.email}</p>
                    <div className="grants">
                      {relationship.accessGrants.map((grant) => (
                        <div key={grant.id} className="grant-item">
                          <Badge
                            text={grant.scope.map(getScopeLabel).join(', ')}
                            tone={getStatusColor(grant.status)}
                          />
                          {grant.expiresAt && (
                            <small>过期时间: {formatDate(grant.expiresAt)}</small>
                          )}
                        </div>
                      ))}
                    </div>
                    <p><strong>建立时间:</strong> {formatDate(relationship.createdAt)}</p>
                  </div>
                  <div className="relationship-actions">
                    <Button
                      variant="ghost"
                      onClick={() => handleRevokeRelationship(relationship.id)}
                    >
                      撤销授权
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 已撤销关系 */}
      {activeTab === 'revoked' && (
        <Card heading="已撤销的关系">
          {revokedRelationships.length === 0 ? (
            <div className="empty-state">
              <p>暂无已撤销的关系</p>
            </div>
          ) : (
            <div className="relationship-list">
              {revokedRelationships.map((relationship) => (
                <div key={relationship.id} className="relationship-item revoked">
                  <div className="relationship-info">
                    <h3>{relationship.party.displayName}</h3>
                    <p>{getRoleLabel(relationship.party.role.name)} • {relationship.party.email}</p>
                    <p><strong>撤销时间:</strong> {formatDate(relationship.revokedAt)}</p>
                    {relationship.reason && (
                      <p><strong>撤销原因:</strong> {relationship.reason}</p>
                    )}
                  </div>
                  <div className="relationship-status">
                    <Badge text="已撤销" tone="danger" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 响应请求模态框 */}
      {showResponseForm && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>处理访问请求</h2>
            <p>来自: {selectedRequest.requester.displayName} ({getRoleLabel(selectedRequest.requester.role.name)})</p>
            <p>申请目的: {selectedRequest.purpose}</p>
            
            <form onSubmit={handleSubmit(onSubmitResponse)}>
              <FormField
                label="处理决定"
                error={errors.status}
                required
              >
                <FormSelect
                  {...register('status')}
                  options={[
                    { value: 'APPROVED', label: '同意' },
                    { value: 'REJECTED', label: '拒绝' },
                  ]}
                />
              </FormField>

              {watch('status') === 'APPROVED' && (
                <>
                  <FormField
                    label="授权范围"
                    error={errors.scopes}
                    helpText="选择允许查看的数据范围"
                  >
                    <div className="scope-checkboxes">
                      {scopeOptions.map((option) => (
                        <FormCheckbox
                          key={option.value}
                          {...register('scopes')}
                          label={option.label}
                          checked={selectedScopes.includes(option.value)}
                          onChange={(e) => {
                            const value = option.value;
                            if (e.target.checked) {
                              setValue('scopes', [...selectedScopes, value]);
                            } else {
                              setValue('scopes', selectedScopes.filter(s => s !== value));
                            }
                          }}
                        />
                      ))}
                    </div>
                  </FormField>

                  <FormField
                    label="授权期限"
                    error={errors.duration}
                    helpText="选择授权的有效期"
                  >
                    <FormSelect
                      {...register('duration')}
                      options={durationOptions}
                    />
                  </FormField>
                </>
              )}

              <div className="form-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowResponseForm(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '处理中...' : '确认'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}