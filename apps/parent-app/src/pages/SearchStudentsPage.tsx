import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@kids/ui-kit';
import { useFormValidation, FormField, FormInput, FormSelect } from '@kids/forms';
import { httpClient } from '../services/http';
import { z } from 'zod';

// 搜索结果的学生信息
const searchResultSchema = z.object({
  id: z.string(),
  anonymousId: z.string(),
  searchNickname: z.string(),
  schoolName: z.string().optional(),
  className: z.string().optional(),
  displayName: z.string(),
});

// 搜索表单
const searchFormSchema = z.object({
  nickname: z.string().min(2, '昵称至少需要2个字符'),
  schoolName: z.string().optional(),
  className: z.string().optional(),
});

// 关注申请表单
const followRequestSchema = z.object({
  studentAnonymousId: z.string(),
  purpose: z.string(),
  reason: z.string().min(10, '申请理由至少需要10个字符'),
  expiresAt: z.string().optional(),
});

type SearchResult = z.infer<typeof searchResultSchema>;
type SearchFormData = z.infer<typeof searchFormSchema>;
type FollowRequestData = z.infer<typeof followRequestSchema>;

export function SearchStudentsPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<SearchResult | null>(null);
  const [showFollowForm, setShowFollowForm] = useState(false);

  // 搜索表单
  const {
    register: registerSearch,
    handleSubmit: handleSearchSubmit,
    formState: { errors: searchErrors },
    watch: watchSearch,
  } = useFormValidation<SearchFormData>({
    schema: searchFormSchema,
    defaultValues: {
      nickname: '',
      schoolName: '',
      className: '',
    },
  });

  // 关注申请表单
  const {
    register: registerFollow,
    handleSubmit: handleFollowSubmit,
    formState: { errors: followErrors, isSubmitting },
    reset: resetFollow,
  } = useFormValidation<FollowRequestData>({
    schema: followRequestSchema,
    defaultValues: {
      studentAnonymousId: '',
      purpose: 'parent-view',
      reason: '',
      expiresAt: '',
    },
  });

  const handleSearch = async (data: SearchFormData) => {
    try {
      setLoading(true);
      const results = await httpClient.get('/students/search', {
        query: data,
      });
      setSearchResults(results);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowStudent = (student: SearchResult) => {
    setSelectedStudent(student);
    resetFollow({
      studentAnonymousId: student.anonymousId,
      purpose: 'parent-view',
      reason: '',
      expiresAt: '',
    });
    setShowFollowForm(true);
  };

  const submitFollowRequest = async (data: FollowRequestData) => {
    try {
      await httpClient.post('/students/follow-request', data);
      setShowFollowForm(false);
      setSelectedStudent(null);
      alert('关注申请已发送，等待学生同意');
    } catch (error: any) {
      console.error('发送关注申请失败:', error);
      alert(error.message || '发送申请失败');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="search-students-page">
      <div className="page-header">
        <h1>搜索学生</h1>
        <p>通过昵称和学校信息搜索想要关注的学生</p>
      </div>

      {/* 搜索表单 */}
      <Card heading="搜索学生">
        <form onSubmit={handleSearchSubmit(handleSearch)}>
          <div className="search-form">
            <FormField
              label="学生昵称"
              error={searchErrors.nickname}
              required
              helpText="请输入学生的搜索昵称"
            >
              <FormInput
                {...registerSearch('nickname')}
                type="text"
                placeholder="请输入学生昵称"
                disabled={loading}
              />
            </FormField>

            <FormField
              label="学校名称"
              error={searchErrors.schoolName}
              helpText="可选，帮助缩小搜索范围"
            >
              <FormInput
                {...registerSearch('schoolName')}
                type="text"
                placeholder="请输入学校名称"
                disabled={loading}
              />
            </FormField>

            <FormField
              label="班级名称"
              error={searchErrors.className}
              helpText="可选，帮助缩小搜索范围"
            >
              <FormInput
                {...registerSearch('className')}
                type="text"
                placeholder="请输入班级名称"
                disabled={loading}
              />
            </FormField>

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? '搜索中...' : '搜索学生'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <Card heading={`搜索结果 (${searchResults.length} 个)`}>
          <div className="search-results">
            {searchResults.map((student) => (
              <div key={student.id} className="search-result-item">
                <div className="student-info">
                  <h3>{student.searchNickname}</h3>
                  <p className="student-details">
                    {student.schoolName && <span>学校: {student.schoolName}</span>}
                    {student.className && <span>班级: {student.className}</span>}
                  </p>
                  <div className="student-badges">
                    <Badge text="可搜索" tone="success" />
                    <Badge text="需要同意" tone="info" />
                  </div>
                </div>
                <div className="student-actions">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleFollowStudent(student)}
                  >
                    申请关注
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 搜索提示 */}
      {searchResults.length === 0 && !loading && (
        <Card heading="搜索提示">
          <div className="search-tips">
            <h3>如何搜索学生？</h3>
            <ul>
              <li>学生需要先开启"可被搜索"功能</li>
              <li>使用学生设置的搜索昵称进行搜索</li>
              <li>可以结合学校名称和班级名称缩小搜索范围</li>
              <li>搜索到学生后，需要发送关注申请并等待学生同意</li>
            </ul>
            
            <h3>其他关注方式</h3>
            <ul>
              <li>使用学生提供的分享码</li>
              <li>扫描学生分享的二维码</li>
              <li>通过班级邀请码加入班级</li>
            </ul>
          </div>
        </Card>
      )}

      {/* 关注申请表单模态框 */}
      {showFollowForm && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>申请关注学生</h2>
            <p>学生: {selectedStudent.searchNickname}</p>
            {selectedStudent.schoolName && <p>学校: {selectedStudent.schoolName}</p>}
            
            <form onSubmit={handleFollowSubmit(submitFollowRequest)}>
              <FormField
                label="关注目的"
                error={followErrors.purpose}
                required
              >
                <FormSelect
                  {...registerFollow('purpose')}
                  options={[
                    { value: 'parent-view', label: '查看学习进度' },
                    { value: 'parent-supervision', label: '学习监督' },
                    { value: 'parent-support', label: '学习支持' },
                  ]}
                />
              </FormField>

              <FormField
                label="申请理由"
                error={followErrors.reason}
                required
                helpText="请详细说明您申请关注该学生的原因"
              >
                <FormInput
                  {...registerFollow('reason')}
                  type="text"
                  placeholder="请详细说明申请理由..."
                />
              </FormField>

              <FormField
                label="授权期限"
                error={followErrors.expiresAt}
                helpText="选择您希望获得授权的时长"
              >
                <FormSelect
                  {...registerFollow('expiresAt')}
                  options={[
                    { value: '', label: '永久' },
                    { value: '1w', label: '1周' },
                    { value: '1m', label: '1个月' },
                    { value: '3m', label: '3个月' },
                    { value: '1y', label: '1年' },
                  ]}
                />
              </FormField>

              <div className="form-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowFollowForm(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '发送中...' : '发送申请'}
                </Button>
              </div>
            </form>

            <div className="privacy-notice">
              <h4>隐私保护说明</h4>
              <ul>
                <li>学生需要明确同意后，您才能查看其学习数据</li>
                <li>学生可以随时撤销您的关注权限</li>
                <li>我们只分享您明确申请的数据类型</li>
                <li>所有数据访问都有详细的审计记录</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
