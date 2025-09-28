import React, { useState } from 'react';
import { Card, Button, Badge } from '@kids/ui-kit';
import { useFormValidation, FormField, FormInput, FormSelect } from '@kids/forms';
import { z } from 'zod';
import { useRequestStore } from '../stores/request';

// Search form schema remains the same
const searchFormSchema = z.object({
  nickname: z.string().min(2, '昵称至少需要2个字符'),
});

type SearchFormData = z.infer<typeof searchFormSchema>;

// Follow form schema can be simplified as the store handles the logic
const followRequestSchema = z.object({
  reason: z.string().min(10, '申请理由至少需要10个字符'),
});

type FollowRequestData = z.infer<typeof followRequestSchema>;

// A single search result type from our store
interface Student {
  id: string;
  name: string;
  avatar?: string;
}

export function SearchStudentsPage() {
  // Get state and actions from the store
  const { searchResults, loading, discoverStudents, createLinkRequest } = useRequestStore();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showFollowForm, setShowFollowForm] = useState(false);

  const { register: registerSearch, handleSubmit: handleSearchSubmit, formState: { errors: searchErrors } } = useFormValidation<SearchFormData>({
    schema: searchFormSchema,
    defaultValues: { nickname: '' },
  });

  const { register: registerFollow, handleSubmit: handleFollowSubmit, formState: { errors: followErrors, isSubmitting }, reset: resetFollow } = useFormValidation<FollowRequestData>({
    schema: followRequestSchema,
    defaultValues: { reason: '' },
  });

  const handleSearch = async (data: SearchFormData) => {
    await discoverStudents(data.nickname);
  };

  const handleFollowStudent = (student: Student) => {
    setSelectedStudent(student);
    resetFollow({ reason: '' });
    setShowFollowForm(true);
  };

  const submitFollowRequest = async (data: FollowRequestData) => {
    if (!selectedStudent) return;
    try {
      await createLinkRequest(selectedStudent.id, data.reason);
      setShowFollowForm(false);
      setSelectedStudent(null);
      alert('关注申请已发送，等待学生同意');
    } catch (error: any) {
      console.error('发送关注申请失败:', error);
      alert(error.message || '发送申请失败');
    }
  };

  return (
    <div className="search-students-page">
      <div className="page-header">
        <h1>搜索学生</h1>
        <p>通过昵称搜索想要关注的学生</p>
      </div>

      <Card heading="搜索学生">
        <form onSubmit={handleSearchSubmit(handleSearch)}>
          <FormField label="学生昵称" error={searchErrors.nickname} required>
            <FormInput {...registerSearch('nickname')} type="text" placeholder="请输入学生昵称" disabled={loading} />
          </FormField>
          <div className="form-actions">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? '搜索中...' : '搜索学生'}
            </Button>
          </div>
        </form>
      </Card>

      {searchResults.length > 0 && (
        <Card heading={`搜索结果 (${searchResults.length} 个)`}>
          <div className="search-results">
            {searchResults.map((student) => (
              <div key={student.id} className="search-result-item">
                <div className="student-info">
                  <h3>{student.name}</h3>
                </div>
                <div className="student-actions">
                  <Button variant="primary" size="sm" onClick={() => handleFollowStudent(student)}>
                    申请关注
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showFollowForm && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>申请关注学生: {selectedStudent.name}</h2>
            <form onSubmit={handleFollowSubmit(submitFollowRequest)}>
              <FormField label="申请理由" error={followErrors.reason} required helpText="请详细说明您申请关注该学生的原因">
                <FormInput {...registerFollow('reason')} type="text" placeholder="我是...的家长，希望..." />
              </FormField>
              <div className="form-actions">
                <Button type="button" variant="ghost" onClick={() => setShowFollowForm(false)}>
                  取消
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? '发送中...' : '发送申请'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
