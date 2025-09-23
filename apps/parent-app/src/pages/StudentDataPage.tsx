import React, { useState, useEffect } from 'react';
import { useFormValidation, FormField, FormInput } from '@kids/forms';
import { Button, Card, Badge, Progress } from '@kids/ui-kit';
import { httpClient } from '../services/http';
import { z } from 'zod';

// 学生数据的 schema
const studentDataSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string(),
  progress: z.object({
    totalCourses: z.number(),
    completedCourses: z.number(),
    totalLessons: z.number(),
    completedLessons: z.number(),
    xp: z.number(),
    streakDays: z.number(),
  }),
  recentWorks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    createdAt: z.string(),
    status: z.string(),
  })),
  courses: z.array(z.object({
    id: z.string(),
    title: z.string(),
    progress: z.number(),
    status: z.string(),
  })),
});

// 申请查看的 schema
const requestAccessSchema = z.object({
  studentEmail: z.string().email('请输入有效的邮箱地址'),
  purpose: z.string().min(1, '请填写申请目的'),
  reason: z.string().min(10, '申请理由至少需要10个字符'),
});

type StudentData = z.infer<typeof studentDataSchema>;
type RequestAccessData = z.infer<typeof requestAccessSchema>;

export function StudentDataPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // 申请查看表单
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useFormValidation<RequestAccessData>({
    schema: requestAccessSchema,
    defaultValues: {
      studentEmail: '',
      purpose: 'parent-view',
      reason: '',
    },
  });

  useEffect(() => {
    loadAccessibleStudents();
  }, []);

  const loadAccessibleStudents = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get('/relationships/accessible-students');
      setStudents(response);
    } catch (error) {
      console.error('加载学生数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (data: RequestAccessData) => {
    try {
      await httpClient.post('/relationships/request-parent-access', data);
      setShowRequestForm(false);
      reset();
      alert('申请已提交，等待学生同意');
    } catch (error) {
      console.error('提交申请失败:', error);
    }
  };

  const handleViewStudent = async (studentId: string) => {
    try {
      // 检查访问权限
      const hasAccess = await httpClient.get(`/relationships/check-access/${studentId}?scope=progress:read`);
      
      if (!hasAccess.hasAccess) {
        alert('您没有权限查看该学生的数据');
        return;
      }

      // 获取学生详细数据
      const studentData = await httpClient.get(`/students/${studentId}/data`);
      setSelectedStudent(studentData);
    } catch (error) {
      console.error('获取学生数据失败:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'pending': return 'warning';
      default: return 'info';
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="student-data-page">
      <div className="page-header">
        <h1>查看学生数据</h1>
        <Button
          variant="primary"
          onClick={() => setShowRequestForm(true)}
        >
          申请查看新学生
        </Button>
      </div>

      {/* 可访问的学生列表 */}
      <Card heading="可访问的学生">
        {students.length === 0 ? (
          <div className="empty-state">
            <p>您还没有被授权查看任何学生的数据</p>
            <p>请先申请查看权限</p>
          </div>
        ) : (
          <div className="student-list">
            {students.map((student) => (
              <div key={student.id} className="student-item">
                <div className="student-info">
                  <h3>{student.displayName}</h3>
                  <p>{student.email}</p>
                  <div className="student-stats">
                    <Badge text={`${student.progress.xp} XP`} tone="info" />
                    <Badge text={`${student.progress.streakDays} 天连续`} tone="success" />
                  </div>
                </div>
                <div className="student-actions">
                  <Button
                    variant="primary"
                    onClick={() => handleViewStudent(student.id)}
                  >
                    查看详情
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 学生详细数据 */}
      {selectedStudent && (
        <Card heading={`${selectedStudent.displayName} 的学习数据`}>
          <div className="student-details">
            {/* 学习进度概览 */}
            <div className="progress-overview">
              <h3>学习进度概览</h3>
              <div className="progress-stats">
                <div className="stat-item">
                  <span>总课程数</span>
                  <span>{selectedStudent.progress.totalCourses}</span>
                </div>
                <div className="stat-item">
                  <span>已完成课程</span>
                  <span>{selectedStudent.progress.completedCourses}</span>
                </div>
                <div className="stat-item">
                  <span>总课时数</span>
                  <span>{selectedStudent.progress.totalLessons}</span>
                </div>
                <div className="stat-item">
                  <span>已完成课时</span>
                  <span>{selectedStudent.progress.completedLessons}</span>
                </div>
                <div className="stat-item">
                  <span>总经验值</span>
                  <span>{selectedStudent.progress.xp}</span>
                </div>
                <div className="stat-item">
                  <span>连续学习天数</span>
                  <span>{selectedStudent.progress.streakDays}</span>
                </div>
              </div>
            </div>

            {/* 课程进度 */}
            <div className="courses-progress">
              <h3>课程进度</h3>
              <div className="course-list">
                {selectedStudent.courses.map((course) => (
                  <div key={course.id} className="course-item">
                    <div className="course-info">
                      <h4>{course.title}</h4>
                      <Progress value={course.progress} label={`${course.progress}%`} />
                    </div>
                    <Badge
                      text={course.status}
                      tone={getStatusColor(course.status)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 最近作品 */}
            <div className="recent-works">
              <h3>最近作品</h3>
              <div className="works-list">
                {selectedStudent.recentWorks.map((work) => (
                  <div key={work.id} className="work-item">
                    <div className="work-info">
                      <h4>{work.title}</h4>
                      <p>创建时间: {formatDate(work.createdAt)}</p>
                    </div>
                    <Badge
                      text={work.status}
                      tone={getStatusColor(work.status)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 申请查看模态框 */}
      {showRequestForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>申请查看学生数据</h2>
            <form onSubmit={handleSubmit(handleRequestAccess)}>
              <FormField
                label="学生邮箱"
                error={errors.studentEmail}
                required
                helpText="请输入学生的注册邮箱地址"
              >
                <FormInput
                  {...register('studentEmail')}
                  type="email"
                  placeholder="student@example.com"
                />
              </FormField>

              <FormField
                label="申请目的"
                error={errors.purpose}
                required
              >
                <FormInput
                  {...register('purpose')}
                  type="text"
                  value="parent-view"
                  readOnly
                />
              </FormField>

              <FormField
                label="申请理由"
                error={errors.reason}
                required
                helpText="请详细说明您申请查看学生数据的原因"
              >
                <FormInput
                  {...register('reason')}
                  type="text"
                  placeholder="请详细说明申请理由..."
                />
              </FormField>

              <div className="form-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowRequestForm(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '提交中...' : '提交申请'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
