import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@kids/ui-kit';
import { useFormValidation, FormField, FormTextarea, FormSelect } from '@kids/forms';
import { httpClient } from '../services/http';
import { z } from 'zod';

interface StudentWork {
  id: string;
  title: string;
  description: string;
  type: 'project' | 'assignment' | 'exercise' | 'classwork';
  status: 'submitted' | 'in_progress' | 'completed';
  content: string;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  student: {
    id: string;
    displayName: string;
    email: string;
    avatar?: string;
  };
  class: {
    id: string;
    name: string;
  };
  submittedAt: string;
  dueDate?: string;
  previousReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

interface ReviewFormData {
  rating: number;
  comment: string;
  suggestions: string;
  status: 'approved' | 'needs_revision' | 'rejected';
  privateNotes: string;
}

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, '评价内容至少需要10个字符'),
  suggestions: z.string().optional(),
  status: z.enum(['approved', 'needs_revision', 'rejected']),
  privateNotes: z.string().optional(),
});

export function ReviewWorkflowPage() {
  const [works, setWorks] = useState<StudentWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState<StudentWork | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'needs_review' | 'reviewed'>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useFormValidation<ReviewFormData>({
    schema: reviewSchema,
    defaultValues: {
      rating: 5,
      comment: '',
      suggestions: '',
      status: 'approved',
      privateNotes: '',
    },
  });

  const selectedStatus = watch('status');

  useEffect(() => {
    loadWorks();
  }, [filter, selectedClass]);

  const loadWorks = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get<StudentWork[]>('/teachers/works', {
        query: {
          filter,
          classId: selectedClass === 'all' ? undefined : selectedClass,
        },
      });
      setWorks(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('加载作品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewWork = (work: StudentWork) => {
    setSelectedWork(work);
    setShowReviewForm(true);
    reset({
      rating: work.previousReviews.length > 0 ? work.previousReviews[0].rating : 5,
      comment: '',
      suggestions: '',
      status: 'approved',
      privateNotes: '',
    });
  };

  const onSubmitReview = async (data: ReviewFormData) => {
    if (!selectedWork) return;

    try {
      await httpClient.post(`/teachers/works/${selectedWork.id}/review`, {
        body: {
          ...data,
          workId: selectedWork.id,
        },
      });

      setShowReviewForm(false);
      setSelectedWork(null);
      loadWorks();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('提交评价失败:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleApproveWork = async (workId: string) => {
    try {
      await httpClient.post(`/teachers/works/${workId}/approve`);
      loadWorks();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('批准作品失败:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRequestRevision = async (workId: string) => {
    try {
      await httpClient.post(`/teachers/works/${workId}/request-revision`);
      loadWorks();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('请求修改失败:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'info';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'approved':
        return 'success';
      case 'needs_revision':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return '已提交';
      case 'in_progress':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'approved':
        return '已批准';
      case 'needs_revision':
        return '需要修改';
      case 'rejected':
        return '已拒绝';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'project':
        return '项目';
      case 'assignment':
        return '作业';
      case 'exercise':
        return '练习';
      case 'classwork':
        return '课堂作品';
      default:
        return type;
    }
  };

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="review-workflow-page">
      <div className="page-header">
        <h1>作品点评</h1>
        <div className="header-controls">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="filter-selector"
          >
            <option value="all">全部作品</option>
            <option value="submitted">待点评</option>
            <option value="needs_review">需要修改</option>
            <option value="reviewed">已点评</option>
          </select>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="class-selector"
          >
            <option value="all">所有班级</option>
            {/* 这里应该从班级列表加载 */}
          </select>
        </div>
      </div>

      {/* 作品列表 */}
      <div className="works-list">
        {works.map((work) => (
          <Card key={work.id} className="work-card">
            <div className="work-header">
              <div className="work-info">
                <h3>{work.title}</h3>
                <p>{work.description}</p>
                <div className="work-meta">
                  <Badge text={getTypeText(work.type)} tone="info" />
                  <Badge text={getStatusText(work.status)} tone={getStatusColor(work.status)} />
                  <span className="work-date">提交时间: {formatDateTime(work.submittedAt)}</span>
                </div>
              </div>
              <div className="work-actions">
                <Button variant="primary" onClick={() => handleReviewWork(work)}>
                  点评
                </Button>
                <Button variant="ghost">查看详情</Button>
              </div>
            </div>

            <div className="work-content">
              <div className="student-info">
                <div className="student-avatar">
                  {work.student.avatar ? (
                    <img src={work.student.avatar} alt={work.student.displayName} />
                  ) : (
                    <div className="avatar-placeholder">{work.student.displayName.charAt(0)}</div>
                  )}
                </div>
                <div className="student-details">
                  <h4>{work.student.displayName}</h4>
                  <p>{work.student.email}</p>
                  <p>班级: {work.class.name}</p>
                </div>
              </div>

              <div className="work-preview">
                <h4>作品内容</h4>
                <div className="content-preview">
                  {work.content.length > 200
                    ? `${work.content.substring(0, 200)}...`
                    : work.content}
                </div>
                {work.attachments.length > 0 && (
                  <div className="attachments">
                    <h5>附件:</h5>
                    <div className="attachment-list">
                      {work.attachments.map((attachment) => (
                        <div key={attachment.id} className="attachment-item">
                          <span className="attachment-name">{attachment.name}</span>
                          <Button variant="ghost" size="sm">
                            下载
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {work.previousReviews.length > 0 && (
                <div className="previous-reviews">
                  <h4>历史评价</h4>
                  {work.previousReviews.map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-rating">{getRatingStars(review.rating)}</div>
                      <div className="review-comment">{review.comment}</div>
                      <div className="review-date">{formatDateTime(review.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* 点评表单模态框 */}
      {showReviewForm && selectedWork && (
        <div className="modal-overlay">
          <div className="modal large">
            <h2>点评作品: {selectedWork.title}</h2>
            <p>
              学生: {selectedWork.student.displayName} | 班级: {selectedWork.class.name}
            </p>

            <div className="work-content-display">
              <h3>作品内容</h3>
              <div className="content-full">{selectedWork.content}</div>
              {selectedWork.attachments.length > 0 && (
                <div className="attachments">
                  <h4>附件:</h4>
                  <div className="attachment-list">
                    {selectedWork.attachments.map((attachment) => (
                      <div key={attachment.id} className="attachment-item">
                        <span className="attachment-name">{attachment.name}</span>
                        <Button variant="ghost" size="sm">
                          下载
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmitReview)}>
              <FormField label="评分" error={errors.rating} required helpText="1-5星评分">
                <FormSelect
                  register={register('rating')}
                  options={[
                    { value: '1', label: '⭐ (1星)' },
                    { value: '2', label: '⭐⭐ (2星)' },
                    { value: '3', label: '⭐⭐⭐ (3星)' },
                    { value: '4', label: '⭐⭐⭐⭐ (4星)' },
                    { value: '5', label: '⭐⭐⭐⭐⭐ (5星)' },
                  ]}
                />
              </FormField>

              <FormField
                label="评价内容"
                error={errors.comment}
                required
                helpText="请详细评价学生的作品"
              >
                <FormTextarea
                  register={register('comment')}
                  placeholder="请详细评价学生的作品..."
                  rows={4}
                />
              </FormField>

              <FormField
                label="改进建议"
                error={errors.suggestions}
                helpText="可选，提供具体的改进建议"
              >
                <FormTextarea
                  register={register('suggestions')}
                  placeholder="提供改进建议..."
                  rows={3}
                />
              </FormField>

              <FormField label="处理状态" error={errors.status} required>
                <FormSelect
                  register={register('status')}
                  options={[
                    { value: 'approved', label: '通过' },
                    { value: 'needs_revision', label: '需要修改' },
                    { value: 'rejected', label: '拒绝' },
                  ]}
                />
              </FormField>

              {selectedStatus === 'needs_revision' && (
                <FormField
                  label="修改要求"
                  error={errors.privateNotes}
                  helpText="详细说明需要修改的地方"
                >
                  <FormTextarea
                    register={register('privateNotes')}
                    placeholder="详细说明需要修改的地方..."
                    rows={3}
                  />
                </FormField>
              )}

              <div className="form-actions">
                <Button type="button" variant="ghost" onClick={() => setShowReviewForm(false)}>
                  取消
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? '提交中...' : '提交评价'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

