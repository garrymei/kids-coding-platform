import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@kids/ui-kit';
import { useFormValidation, FormField, FormSelect } from '@kids/forms';
import { httpClient } from '../services/http';
import { z } from 'zod';

// 分享码信息
const shareCodeSchema = z.object({
  shareCode: z.string(),
  expiresAt: z.string().nullable(),
  purpose: z.string(),
  qrCodeUrl: z.string(),
  createdAt: z.string(),
});

// 生成分享码表单
const generateShareCodeSchema = z.object({
  purpose: z.string(),
  expiresAt: z.string().optional(),
});

type ShareCodeInfo = z.infer<typeof shareCodeSchema>;
type GenerateShareCodeData = z.infer<typeof generateShareCodeSchema>;

export function ShareCodePage() {
  const [shareCodes, setShareCodes] = useState<ShareCodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useFormValidation<GenerateShareCodeData>({
    schema: generateShareCodeSchema,
    defaultValues: {
      purpose: 'parent-view',
      expiresAt: '',
    },
  });

  useEffect(() => {
    loadShareCodes();
  }, []);

  const loadShareCodes = async () => {
    try {
      setLoading(true);
      // 这里应该调用获取分享码列表的API
      // const response = await httpClient.get('/students/share-codes');
      // setShareCodes(response);
      setShareCodes([]); // 临时空数组
    } catch (error) {
      console.error('加载分享码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateShareCode = async (data: GenerateShareCodeData) => {
    try {
      const response = await httpClient.post('/students/share-code', data);
      setShareCodes([response, ...shareCodes]);
      setShowGenerateForm(false);
      reset();
      alert('分享码生成成功！');
    } catch (error) {
      console.error('生成分享码失败:', error);
    }
  };

  const handleCopyShareCode = (shareCode: string) => {
    navigator.clipboard.writeText(shareCode);
    alert('分享码已复制到剪贴板');
  };

  const handleCopyShareLink = (shareCode: string) => {
    const shareLink = `${window.location.origin}/follow/${shareCode}`;
    navigator.clipboard.writeText(shareLink);
    alert('分享链接已复制到剪贴板');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getPurposeLabel = (purpose: string) => {
    switch (purpose) {
      case 'parent-view': return '家长查看';
      case 'teacher-view': return '教师查看';
      case 'friend-view': return '朋友查看';
      default: return purpose;
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="share-code-page">
      <div className="page-header">
        <h1>分享码管理</h1>
        <p>生成分享码让家长和老师关注您</p>
        <Button
          variant="primary"
          onClick={() => setShowGenerateForm(true)}}
        >
          生成新分享码
        </Button>
      </div>

      {/* 分享码列表 */}
      <Card heading="我的分享码">
        {shareCodes.length === 0 ? (
          <div className="empty-state">
            <p>还没有生成任何分享码</p>
            <p>点击"生成新分享码"开始创建</p>
          </div>
        ) : (
          <div className="share-codes-list">
            {shareCodes.map((shareCode) => (
              <div key={shareCode.shareCode} className="share-code-item">
                <div className="share-code-info">
                  <div className="share-code-header">
                    <h3>{shareCode.shareCode}</h3>
                    <div className="share-code-badges">
                      <Badge text={getPurposeLabel(shareCode.purpose)}} tone="info" />
                      {isExpired(shareCode.expiresAt) ? (
                        <Badge text="已过期" tone="danger" />
                      ) : shareCode.expiresAt ? (
                        <Badge text="有时效" tone="warning" />
                      ) : (
                        <Badge text="永久有效" tone="success" />
                      )}}
                    </div>
                  </div>
                  
                  <div className="share-code-details">
                    <p>创建时间: {formatDate(shareCode.createdAt)}}</p>
                    {shareCode.expiresAt && (
                      <p>过期时间: {formatDate(shareCode.expiresAt)}}</p>
                    )}}
                  </div>

                  <div className="share-code-actions">
                    <Button
                      variant="ghost"
                      onClick={() => handleCopyShareCode(shareCode.shareCode)}}
                    >
                      复制分享码
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleCopyShareLink(shareCode.shareCode)}}
                    >
                      复制分享链接
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => window.open(shareCode.qrCodeUrl, '_blank')}}
                    >
                      查看二维码
                    </Button>
                  </div>
                </div>
              </div>
            ))}}
          </div>
        )}}
      </Card>

      {/* 生成分享码表单模态框 */}
      {showGenerateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>生成新分享码</h2>
            <p>生成分享码让家长和老师可以关注您</p>
            
            <form onSubmit={handleSubmit(handleGenerateShareCode)}}>
              <FormField
                label="分享目的"
                error={errors.purpose}
                required
                helpText="选择分享码的用途"
              >
                <FormSelect
                  register={register('purpose')}
                  options={[
                    { value: 'parent-view', label: '家长查看学习进度' },
                    { value: 'teacher-view', label: '教师查看学习情况' },
                    { value: 'friend-view', label: '朋友查看作品' },
                  ]}
                />
              </FormField>

              <FormField
                label="有效期"
                error={errors.expiresAt}
                helpText="选择分享码的有效期，过期后需要重新生成"
              >
                <FormSelect
                  register={register('expiresAt')}
                  options={[
                    { value: '', label: '永久有效' },
                    { value: '1h', label: '1小时' },
                    { value: '1d', label: '1天' },
                    { value: '1w', label: '1周' },
                    { value: '1m', label: '1个月' },
                    { value: '3m', label: '3个月' },
                  ]}
                />
              </FormField>

              <div className="form-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowGenerateForm(false)}}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '生成中...' : '生成分享码'}
                </Button>
              </div>
            </form>

            <div className="share-code-tips">
              <h4>使用提示</h4>
              <ul>
                <li>分享码生成后，家长和老师可以使用它来关注您</li>
                <li>您可以在授权中心管理所有的关注关系</li>
                <li>分享码可以多次使用，直到过期或被撤销</li>
                <li>建议定期更换分享码，提高安全性</li>
              </ul>
            </div>
          </div>
        </div>
      )}}

      {/* 使用说明 */}
      <Card heading="使用说明" className="usage-guide">
        <div className="guide-content">
          <h3>如何分享给家长？</h3>
          <ol>
            <li>生成分享码，选择"家长查看学习进度"</li>
            <li>将分享码或分享链接发送给家长</li>
            <li>家长使用分享码申请关注您</li>
            <li>您在授权中心同意关注申请</li>
            <li>家长就可以查看您的学习数据了</li>
          </ol>

          <h3>如何分享给老师？</h3>
          <ol>
            <li>生成分享码，选择"教师查看学习情况"</li>
            <li>将分享码发送给老师</li>
            <li>老师使用分享码申请关注您</li>
            <li>您在授权中心同意关注申请</li>
            <li>老师就可以查看您的学习进度了</li>
          </ol>

          <h3>安全提醒</h3>
          <ul>
            <li>不要将分享码分享给不信任的人</li>
            <li>定期检查关注您的人，及时撤销不需要的关注</li>
            <li>如果分享码泄露，请立即生成新的分享码</li>
            <li>分享码过期后会自动失效，需要重新生成</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}


