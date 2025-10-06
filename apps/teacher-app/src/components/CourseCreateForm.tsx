import { useState } from 'react';
import { useFormValidation, FormField, FormInput, FormTextarea, FormSelect, FormCheckbox } from '@kids/forms';
import { Button } from '@kids/ui-kit';
import { courseCreateSchema, type CourseCreateFormData } from '@kids/forms';

interface CourseCreateFormProps {
  onSubmit: (data: CourseCreateFormData) => Promise<void>;
  isLoading?: boolean;
}

const difficultyOptions = [
  { value: 'beginner', label: '初级' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' },
];

const commonTags = [
  'Python',
  'JavaScript',
  '算法',
  '数据结构',
  '游戏开发',
  '网页设计',
  '移动开发',
  '人工智能',
  '机器学习',
  '数据分析',
];

export function CourseCreateForm({ onSubmit, isLoading = false }: CourseCreateFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useFormValidation<CourseCreateFormData>({
    schema: courseCreateSchema,
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'beginner',
      tags: [],
      estimatedDuration: 60,
      isPublic: true,
    },
  });

  const [isSubmittingRequest, setSubmittingRequest] = useState(false);

  const selectedTags = watch('tags') ?? [];
  const tagsRegister = register('tags');

  const handleTagToggle = (tag: string) => {
    const isSelected = selectedTags.includes(tag);
    const nextTags = isSelected
      ? selectedTags.filter((item) => item !== tag)
      : [...selectedTags, tag];

    setValue('tags', nextTags, { shouldValidate: true });
  };

  const handleFormSubmit = async (data: CourseCreateFormData) => {
    try {
      setSubmittingRequest(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Course creation failed:', error);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const isBusy = isSubmitting || isLoading || isSubmittingRequest;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="course-create-form">
      <h2 className="course-create-form__title">创建新课程</h2>

      <FormField label="课程标题" error={errors.title} required>
        <FormInput
          register={register('title')}
          type="text"
          placeholder="请输入课程标题"
          disabled={isBusy}
        />
      </FormField>

      <FormField
        label="课程描述"
        error={errors.description}
        required
        helpText="简要介绍课程内容和学习目标"
      >
        <FormTextarea
          register={register('description')}
          placeholder="请输入课程描述..."
          rows={4}
          disabled={isBusy}
        />
      </FormField>

      <FormField label="难度等级" error={errors.difficulty} required>
        <FormSelect
          register={register('difficulty')}
          options={difficultyOptions}
          placeholder="请选择难度等级"
          disabled={isBusy}
        />
      </FormField>

      <FormField
        label="课程标签"
        error={errors.tags}
        required
        helpText="选择相关的标签，最多可选择 5 个"
      >
        <div className="tag-selector">
          {commonTags.map((tag) => (
            <FormCheckbox
              key={tag}
              register={{
                ...tagsRegister,
                value: tag,
                onChange: (event) => {
                  tagsRegister.onChange(event);
                  handleTagToggle(tag);
                },
              }}
              label={tag}
              checked={selectedTags.includes(tag)}
              disabled={
                isBusy || (!selectedTags.includes(tag) && selectedTags.length >= 5)
              }
            />
          ))}
        </div>
        <div className="tag-info">已选择 {selectedTags.length}/5 个标签</div>
      </FormField>

      <FormField
        label="预计时长（分钟）"
        error={errors.estimatedDuration}
        required
        helpText="整个课程的预计学习时间"
      >
        <FormInput
          register={register('estimatedDuration', { valueAsNumber: true })}
          type="number"
          min="1"
          max="480"
          placeholder="60"
          disabled={isBusy}
        />
      </FormField>

      <FormField label="课程设置" error={errors.isPublic}>
        <FormCheckbox
          register={register('isPublic')}
          label="公开课程（其他教师和学生可以查看）"
          disabled={isBusy}
        />
      </FormField>

      <div className="form-actions">
        <Button type="button" variant="ghost" disabled={isBusy}>
          取消
        </Button>
        <Button type="submit" variant="primary" disabled={isBusy}>
          {isBusy ? '创建中...' : '创建课程'}
        </Button>
      </div>
    </form>
  );
}