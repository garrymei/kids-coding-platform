import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Progress } from '@kids/ui-kit';
import { useFormValidation, FormField, FormInput } from '@kids/forms';
import { httpClient } from '../services/http';
import { z } from 'zod';

// 分享码绑定的 schema
const shareCodeSchema = z.object({
  shareCode: z.string().min(6, '分享码至少需要6个字符'),
});

// 绑定状态的 schema
const bindingStatusSchema = z.object({
  id: z.string(),
  student: z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.string(),
    avatar: z.string().optional(),
  }),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']),
  requestedAt: z.string(),
  respondedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  scopes: z.array(z.string()).optional(),
});

type ShareCodeData = z.infer<typeof shareCodeSchema>;
type BindingStatus = z.infer<typeof bindingStatusSchema>;

export function ParentBindingPage() {
  const [bindingRequests, setBindingRequests] = useState<BindingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareCodeForm, setShowShareCodeForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useFormValidation<ShareCodeData>({
    schema: shareCodeSchema,
    defaultValues: {
      shareCode: '',
    },
  });

  useEffect(() => {
    loadBindingRequests();
  }, []);

  const loadBindingRequests = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get('/relationships/parent-binding-requests');
      setBindingRequests(response);
    } catch (error) {
      console.error('加载绑定请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitShareCode = async (data: ShareCodeData) => {
    try {
      await httpClient.post('/relationships/bind-with-share-code', {
        shareCode: data.shareCode,
      });
      
      setShowShareCodeForm(false);
      reset();
      loadBindingRequests();
      alert('绑定请求已发送，等待学生同意');
    } catch (error: any) {
      console.error('提交分享码失败:', error);
      alert(error.message || '绑定失败，请检查分享码是否正确');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('确定要取消此绑定请求吗？')) return;

    try {
      await httpClient.delete(`/relationships/binding-requests/${requestId}`);
      loadBindingRequests();
    } catch (error) {
      console.error('取消请求失败:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'expired': return 'danger';
      default: return 'info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '等待学生同意';
      case 'approved': return '已授权';
      case 'rejected': return '已拒绝';
      case 'expired': return '已过期';
      default: return status;
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
    <div className="parent-binding-page">
      <div className="page-header">
        <h1>绑定孩子账号</h1>
        <p>通过分享码或邮箱地址绑定孩子的学习账号</p>
        <Button
          variant="primary"
          onClick={() => setShowShareCodeForm(true)}
        >
          输入分享码
        </Button>
      </div>

      {/* 绑定请求列表 */}
      <Card heading="绑定请求状态">
        {bindingRequests.length === 0 ? (
          <div className="empty-state">
            <p>还没有绑定任何孩子账号</p>
            <p>请使用分享码或邮箱地址申请绑定</p>
          </div>
        ) : (
          <div className="binding-requests-list">
            {bindingRequests.map((request) => (
              <div key={request.id} className="binding-request-item">
                <div className="student-info">
                  <div className="student-avatar">
                    {request.student.avatar ? (
                      <img src={request.student.avatar} alt={request.student.displayName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {request.student.displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="student-details">
                    <h3>{request.student.displayName}</h3>
                    <p>{request.student.email}</p>
                    <div className="request-meta">
                      <span>请求时间: {formatDate(request.requestedAt)}</span>
                      {request.respondedAt && (
                        <span>响应时间: {formatDate(request.respondedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="request-status">
                  <Badge
                    text={getStatusText(request.status)}
                    tone={getStatusColor(request.status)}
                  />
                  {request.expiresAt && (
                    <small>过期时间: {formatDate(request.expiresAt)}</small>
                  )}
                </div>

                {request.scopes && request.scopes.length > 0 && (
                  <div className="authorized-scopes">
                    <h4>授权范围:</h4>
                    <div className="scope-tags">
                      {request.scopes.map((scope) => (
                        <Badge
                          key={scope}
                          text={getScopeLabel(scope)}
                          tone="info"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="request-actions">
                  {request.status === 'pending' && (
                    <Button
                      variant="ghost"
                      onClick={() => handleCancelRequest(request.id)}
                    >
                      取消请求
                    </Button>
                  )}
                  {request.status === 'approved' && (
                    <Button
                      variant="primary"
                      onClick={() => window.location.href = `/child-data/${request.student.id}`}
                    >
                      查看数据
                    </Button>
                  )}
                  {request.status === 'rejected' && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowShareCodeForm(true)}
                    >
                      重新申请
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 绑定说明 */}
      <Card heading="绑定说明" className="binding-instructions">
        <div className="instructions-content">
          <h3>如何绑定孩子账号？</h3>
          <div className="instruction-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>获取分享码</h4>
                <p>让孩子在学生端生成分享码，或直接输入孩子的注册邮箱</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>提交绑定请求</h4>
                <p>输入分享码或邮箱地址，系统会向孩子发送授权请求</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>等待孩子同意</h4>
                <p>孩子需要在学生端同意授权，您才能查看其学习数据</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>开始查看数据</h4>
                <p>授权通过后，您就可以查看孩子的学习进度和作品了</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 分享码输入模态框 */}
      {showShareCodeForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>输入分享码</h2>
            <p>请输入孩子提供的分享码，或输入孩子的注册邮箱地址</p>
            
            <form onSubmit={handleSubmit(handleSubmitShareCode)}>
              <FormField
                label="分享码或邮箱"
                error={errors.shareCode}
                required
                helpText="请输入6位分享码或孩子的注册邮箱"
              >
                <FormInput
                  {...register('shareCode')}
                  type="text"
                  placeholder="ABC123 或 child@example.com"
                  disabled={isSubmitting}
                />
              </FormField>

              <div className="form-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowShareCodeForm(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '提交中...' : '提交请求'}
                </Button>
              </div>
            </form>

            <div className="privacy-notice">
              <h4>隐私保护说明</h4>
              <ul>
                <li>我们严格保护孩子的隐私，只有在孩子明确同意的情况下才会分享数据</li>
                <li>孩子可以随时撤销您的访问权限</li>
                <li>我们只分享您明确申请的数据类型，不会超出授权范围</li>
                <li>所有数据访问都有详细的审计记录</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
