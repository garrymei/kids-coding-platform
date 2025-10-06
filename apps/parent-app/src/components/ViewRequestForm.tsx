// React import removed as it's not used
import { useFormValidation, FormField, FormInput, FormTextarea, FormSelect } from '@kids/forms';
import { Button } from '@kids/ui-kit';
import { z } from 'zod';

// 家长申请查看表单的 schema
const viewRequestSchema = z.object({
  studentName: z.string().min(2, '学生姓名至少需要2个字符').max(50, '学生姓名不能超过50个字符'),
  studentEmail: z.string().min(1, '学生邮箱不能为空').email('请输入有效的学生邮箱地址'),
  relationship: z.enum(['parent', 'guardian', 'other'], {
    required_error: '请选择与学生的关系',
  }),
  reason: z.string().min(10, '申请理由至少需要10个字符').max(500, '申请理由不能超过500个字符'),
  contactPhone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
    .optional()
    .or(z.literal('')),
  additionalInfo: z.string().max(1000, '补充信息不能超过1000个字符').optional().or(z.literal('')),
});

type ViewRequestFormData = z.infer<typeof viewRequestSchema>;

interface ViewRequestFormProps {
  onSubmit: (data: ViewRequestFormData) => Promise<void>;
  isLoading?: boolean;
}

const relationshipOptions = [
  { value: 'parent', label: '父母' },
  { value: 'guardian', label: '监护人' },
  { value: 'other', label: '其他' },
];

export function ViewRequestForm({ onSubmit, isLoading = false }: ViewRequestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormValidation<ViewRequestFormData>({
    schema: viewRequestSchema,
    defaultValues: {
      studentName: '',
      studentEmail: '',
      relationship: 'parent',
      reason: '',
      contactPhone: '',
      additionalInfo: '',
    },
  });

  const handleFormSubmit = async (data: ViewRequestFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('View request failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="view-request-form">
      <h2 className="view-request-form__title">申请查看学生进度</h2>

      <FormField label="学生姓名" error={errors.studentName} required>
        <FormInput
          {...register('studentName')}
          type="text"
          placeholder="请输入学生姓名"
          disabled={isSubmitting || isLoading}
        />
      </FormField>

      <FormField label="学生邮箱" error={errors.studentEmail} required>
        <FormInput
          {...register('studentEmail')}
          type="email"
          placeholder="请输入学生注册邮箱"
          disabled={isSubmitting || isLoading}
        />
      </FormField>

      <FormField label="与学生的关系" error={errors.relationship} required>
        <FormSelect
          {...register('relationship')}
          options={relationshipOptions}
          placeholder="请选择关系"
          disabled={isSubmitting || isLoading}
        />
      </FormField>

      <FormField
        label="申请理由"
        error={errors.reason}
        required
        helpText="请详细说明您申请查看学生进度的原因"
      >
        <FormTextarea
          {...register('reason')}
          placeholder="请详细说明申请理由..."
          rows={4}
          disabled={isSubmitting || isLoading}
        />
      </FormField>

      <FormField label="联系电话" error={errors.contactPhone} helpText="可选，用于紧急联系">
        <FormInput
          {...register('contactPhone')}
          type="tel"
          placeholder="请输入手机号码"
          disabled={isSubmitting || isLoading}
        />
      </FormField>

      <FormField label="补充信息" error={errors.additionalInfo} helpText="可选，提供其他相关信息">
        <FormTextarea
          {...register('additionalInfo')}
          placeholder="其他需要说明的信息..."
          rows={3}
          disabled={isSubmitting || isLoading}
        />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting || isLoading}
        style={{ width: '100%', marginTop: '1rem' }}
      >
        {isSubmitting || isLoading ? '提交中...' : '提交申请'}
      </Button>
    </form>
  );
}
