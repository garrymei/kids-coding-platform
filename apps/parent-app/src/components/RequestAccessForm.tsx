import { useState } from 'react';
import { useFormValidation, FormField, FormInput, FormTextarea, FormSelect } from '@kids/forms';
import { Button, Card } from '@kids/ui-kit';
import { httpClient } from '../services/http';
import { z } from 'zod';

const requestAccessSchema = z.object({
  studentEmail: z.string().email('请输入有效的邮箱地址'),
  purpose: z.string().min(1, '请选择申请目的'),
  reason: z.string().min(10, '申请理由至少需要10个字符'),
  duration: z.string().optional(),
});

type RequestAccessData = z.infer<typeof requestAccessSchema>;

interface RequestAccessFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const purposeOptions = [
  { value: 'parent-view', label: '查看学习进度' },
  { value: 'parent-supervision', label: '学习监督' },
  { value: 'parent-support', label: '学习支持' },
  { value: 'parent-report', label: '生成学习报告' },
];

const durationOptions = [
  { value: '1w', label: '1周' },
  { value: '1m', label: '1个月' },
  { value: '3m', label: '3个月' },
  { value: '6m', label: '6个月' },
  { value: '1y', label: '1年' },
  { value: 'permanent', label: '永久' },
];

type DurationValue = (typeof durationOptions)[number]['value'];
const DEFAULT_DURATION: DurationValue = '3m';

export function RequestAccessForm({ onSuccess, onCancel }: RequestAccessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useFormValidation<RequestAccessData>({
    schema: requestAccessSchema,
    defaultValues: {
      studentEmail: '',
      purpose: 'parent-view',
      reason: '',
      duration: '3m',
    },
  });

  const selectedPurpose = watch('purpose');

  const onSubmit = async (data: RequestAccessData) => {
    try {
      setIsSubmitting(true);
      setSubmitStatus('idle');

      // 计算过期时间
      const duration = data.duration ?? DEFAULT_DURATION;

      const expiresAt =
        duration === 'permanent'
          ? null
          : new Date(Date.now() + getDurationMs(duration)).toISOString();

      await httpClient.post<
        void,
        { studentEmail: string; purpose: string; reason: string; expiresAt: string | null }
      >('/relationships/request-parent-access', {
        body: {
          studentEmail: data.studentEmail,
          purpose: data.purpose,
          reason: data.reason,
          expiresAt,
        },
      });

      setSubmitStatus('success');

      // 延迟调用成功回调
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('提交申请失败:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDurationMs = (duration: DurationValue): number => {
    switch (duration) {
      case '1w':
        return 7 * 24 * 60 * 60 * 1000;
      case '1m':
        return 30 * 24 * 60 * 60 * 1000;
      case '3m':
        return 90 * 24 * 60 * 60 * 1000;
      case '6m':
        return 180 * 24 * 60 * 60 * 1000;
      case '1y':
        return 365 * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  };

  const getPurposeDescription = (purpose: string) => {
    switch (purpose) {
      case 'parent-view':
        return '查看孩子的学习进度、完成情况、获得的徽章等学习数据';
      case 'parent-supervision':
        return '监督孩子的学习状态，确保按时完成学习任务';
      case 'parent-support':
        return '了解孩子的学习情况，提供必要的学习支持';
      case 'parent-report':
        return '生成详细的学习报告，了解孩子的学习成果';
      default:
        return '';
    }
  };

  if (submitStatus === 'success') {
    return (
      <Card className="success-card">
        <div className="success-content">
          <div className="success-icon">✅</div>
          <h3>申请提交成功！</h3>
          <p>您的申请已发送给孩子，请等待孩子同意授权。</p>
          <p>孩子将在学生端收到通知，您也可以提醒孩子查看。</p>
          <Button variant="primary" onClick={onSuccess}>
            确定
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="request-access-form">
      <h2>申请查看孩子数据</h2>
      <p className="form-description">
        请输入孩子的注册邮箱，我们将向孩子发送授权请求。
        孩子需要在学生端同意后，您才能查看其学习数据。
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField
          label="孩子邮箱"
          error={errors.studentEmail}
          required
          helpText="请输入孩子在平台上注册的邮箱地址"
        >
          <FormInput
            {...register('studentEmail')}
            type="email"
            placeholder="child@example.com"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="申请目的"
          error={errors.purpose}
          required
          helpText={getPurposeDescription(selectedPurpose)}
        >
          <FormSelect
            {...register('purpose')}
            options={purposeOptions}
            placeholder="请选择申请目的"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="申请理由"
          error={errors.reason}
          required
          helpText="请详细说明您申请查看孩子数据的原因，这将帮助孩子理解您的意图"
        >
          <FormTextarea
            {...register('reason')}
            placeholder="请详细说明申请理由..."
            rows={4}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="授权期限"
          error={errors.duration}
          helpText="选择您希望获得授权的时长，到期后需要重新申请"
        >
          <FormSelect
            {...register('duration')}
            options={durationOptions}
            placeholder="请选择授权期限"
            disabled={isSubmitting}
          />
        </FormField>

        {submitStatus === 'error' && (
          <div className="error-message">
            <p>❌ 提交失败，请检查网络连接后重试</p>
          </div>
        )}

        <div className="form-actions">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '提交申请'}
          </Button>
        </div>
      </form>

      <div className="privacy-notice">
        <h4>隐私保护说明</h4>
        <ul>
          <li>我们严格保护孩子的隐私，只有在孩子明确同意的情况下才会分享数据</li>
          <li>您可以随时撤销授权，孩子也可以随时拒绝或撤销您的访问权限</li>
          <li>我们只分享您明确申请的数据类型，不会超出授权范围</li>
          <li>所有数据访问都有详细的审计记录，确保透明和可追溯</li>
        </ul>
      </div>
    </Card>
  );
}
