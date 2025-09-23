import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Progress } from '@kids/ui-kit';
import { useFormValidation, FormField, FormInput, FormTextarea } from '@kids/forms';
import { httpClient } from '../services/http';
import { z } from 'zod';

interface ClassData {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  enrollments: Array<{
    id: string;
    student: {
      id: string;
      displayName: string;
      email: string;
    };
    status: 'PENDING' | 'ACTIVE' | 'REVOKED';
    createdAt: string;
  }>;
  _count: {
    enrollments: number;
  };
}

const createClassSchema = z.object({
  name: z.string().min(2, '班级名称至少需要2个字符'),
  description: z.string().optional(),
});

type CreateClassData = z.infer<typeof createClassSchema>;

export function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [showInviteCode, setShowInviteCode] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useFormValidation<CreateClassData>({
    schema: createClassSchema,
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get('/classes');
      setClasses(response);
    } catch (error) {
      console.error('加载班级列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (data: CreateClassData) => {
    try {
      const newClass = await httpClient.post('/classes', data);
      setClasses([newClass, ...classes]);
      setShowCreateForm(false);
      setShowInviteCode(newClass.inviteCode);
      reset();
    } catch (error) {
      console.error('创建班级失败:', error);
    }
  };

  const handleCopyInviteCode = (inviteCode: string) => {
    navigator.clipboard.writeText(inviteCode);
    // 这里可以添加复制成功的提示
  };

  const handleApproveEnrollment = async (classId: string, enrollmentId: string) => {
    try {
      await httpClient.post(`/classes/${classId}/approve`, {
        enrollmentId,
      });
      loadClasses();
    } catch (error) {
      console.error('批准入班失败:', error);
    }
  };

  const handleRejectEnrollment = async (classId: string, enrollmentId: string) => {
    try {
      await httpClient.post(`/classes/${classId}/reject`, {
        enrollmentId,
      });
      loadClasses();
    } catch (error) {
      console.error('拒绝入班失败:', error);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('确定要删除这个班级吗？删除后学生将无法访问班级内容。')) return;

    try {
      await httpClient.delete(`/classes/${classId}`);
      setClasses(classes.filter(c => c.id !== classId));
    } catch (error) {
      console.error('删除班级失败:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'REVOKED': return 'danger';
      default: return 'info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '已激活';
      case 'PENDING': return '待审核';
      case 'REVOKED': return '已撤销';
      default: return status;
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="classes-page">
      <div className="page-header">
        <h1>班级管理</h1>
        <Button
          variant="primary"
          onClick={() => setShowCreateForm(true)}
        >
          创建新班级
        </Button>
      </div>

      {/* 班级列表 */}
      <div className="classes-grid">
        {classes.map((classData) => (
          <Card key={classData.id} className="class-card">
            <div className="class-header">
              <h3>{classData.name}</h3>
              <div className="class-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClass(classData)}
                >
                  管理
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClass(classData.id)}
                >
                  删除
                </Button>
              </div>
            </div>

            <div className="class-info">
              <p>{classData.description || '暂无描述'}</p>
              <div className="class-stats">
                <Badge text={`${classData._count.enrollments} 名学生`} tone="info" />
                <Badge text={classData.isActive ? '活跃' : '已停用'} tone={classData.isActive ? 'success' : 'danger'} />
              </div>
            </div>

            <div className="invite-code-section">
              <div className="invite-code">
                <span className="invite-label">邀请码:</span>
                <span className="invite-value">{classData.inviteCode}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyInviteCode(classData.inviteCode)}
                >
                  复制
                </Button>
              </div>
            </div>

            <div className="enrollments-preview">
              <h4>学生列表 ({classData.enrollments.length})</h4>
              <div className="enrollments-list">
                {classData.enrollments.slice(0, 3).map((enrollment) => (
                  <div key={enrollment.id} className="enrollment-item">
                    <div className="student-info">
                      <span className="student-name">{enrollment.student.displayName}</span>
                      <span className="student-email">{enrollment.student.email}</span>
                    </div>
                    <Badge
                      text={getStatusText(enrollment.status)}
                      tone={getStatusColor(enrollment.status)}
                    />
                  </div>
                ))}
                {classData.enrollments.length > 3 && (
                  <div className="more-enrollments">
                    还有 {classData.enrollments.length - 3} 名学生...
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 创建班级表单 */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>创建新班级</h2>
            <form onSubmit={handleSubmit(handleCreateClass)}>
              <FormField
                label="班级名称"
                error={errors.name}
                required
              >
                <FormInput
                  {...register('name')}
                  type="text"
                  placeholder="请输入班级名称"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField
                label="班级描述"
                error={errors.description}
                helpText="可选，描述班级的主要内容和目标"
              >
                <FormTextarea
                  {...register('description')}
                  placeholder="请输入班级描述..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </FormField>

              <div className="form-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateForm(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '创建中...' : '创建班级'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 邀请码显示 */}
      {showInviteCode && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>班级创建成功！</h2>
            <p>请将以下邀请码分享给学生，学生可以使用此邀请码加入班级：</p>
            <div className="invite-code-display">
              <div className="invite-code-large">
                {showInviteCode}
              </div>
              <Button
                variant="primary"
                onClick={() => handleCopyInviteCode(showInviteCode)}
              >
                复制邀请码
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowInviteCode(null)}
            >
              确定
            </Button>
          </div>
        </div>
      )}

      {/* 班级详情模态框 */}
      {selectedClass && (
        <div className="modal-overlay">
          <div className="modal large">
            <h2>{selectedClass.name} - 学生管理</h2>
            
            <div className="class-details">
              <div className="invite-section">
                <h3>邀请码</h3>
                <div className="invite-code">
                  <span className="invite-value">{selectedClass.inviteCode}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyInviteCode(selectedClass.inviteCode)}
                  >
                    复制
                  </Button>
                </div>
              </div>

              <div className="enrollments-section">
                <h3>学生列表 ({selectedClass.enrollments.length})</h3>
                <div className="enrollments-table">
                  {selectedClass.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="enrollment-row">
                      <div className="student-info">
                        <div className="student-name">{enrollment.student.displayName}</div>
                        <div className="student-email">{enrollment.student.email}</div>
                        <div className="enrollment-date">
                          申请时间: {formatDate(enrollment.createdAt)}
                        </div>
                      </div>
                      <div className="enrollment-status">
                        <Badge
                          text={getStatusText(enrollment.status)}
                          tone={getStatusColor(enrollment.status)}
                        />
                      </div>
                      <div className="enrollment-actions">
                        {enrollment.status === 'PENDING' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveEnrollment(selectedClass.id, enrollment.id)}
                            >
                              通过
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectEnrollment(selectedClass.id, enrollment.id)}
                            >
                              拒绝
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <Button
                variant="ghost"
                onClick={() => setSelectedClass(null)}
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}