import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@kids/ui-kit';
import { useFormValidation, FormField, FormInput, FormCheckbox } from '@kids/forms';
import { httpClient } from '../services/http';
import { z } from 'zod';

const searchSettingsSchema = z.object({
  isSearchable: z.boolean(),
  searchNickname: z.string().min(2, '昵称至少需要2个字符').max(20, '昵称不能超过20个字符').optional(),
  schoolName: z.string().max(50, '学校名称不能超过50个字符').optional(),
  className: z.string().max(30, '班级名称不能超过30个字符').optional(),
});

type SearchSettingsData = z.infer<typeof searchSettingsSchema>;

export function SearchSettingsPage() {
  const [settings, setSettings] = useState<SearchSettingsData | null>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useFormValidation<SearchSettingsData>({
    schema: searchSettingsSchema,
    defaultValues: {
      isSearchable: false,
      searchNickname: '',
      schoolName: '',
      className: '',
    },
  });

  const isSearchable = watch('isSearchable');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, explanationRes] = await Promise.all([
        httpClient.get('/students/search-settings'),
        httpClient.get('/students/search-explanation'),
      ]);
      
      setSettings(settingsRes);
      setExplanation(explanationRes);
      reset(settingsRes);
    } catch (error) {
      console.error('加载设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SearchSettingsData) => {
    try {
      await httpClient.put('/students/search-settings', data);
      setSettings(data);
      alert('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };

  const handleToggleSearchable = (checked: boolean) => {
    if (checked) {
      setShowExplanation(true);
    } else {
      setValue('isSearchable', false);
      setValue('searchNickname', '');
      setValue('schoolName', '');
      setValue('className', '');
    }
  };

  const handleConfirmExplanation = () => {
    setValue('isSearchable', true);
    setShowExplanation(false);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="search-settings-page">
      <div className="page-header">
        <h1>搜索设置</h1>
        <p>管理其他人如何找到您</p>
      </div>

      <Card heading="搜索功能设置">
        <form onSubmit={handleSubmit(onSubmit)}}>
          <div className="search-toggle">
            <FormField
              label="允许被搜索"
              helpText="开启后，家长和老师可以通过昵称和学校信息搜索到您"
            >
              <FormCheckbox
                register={register('isSearchable')}
                label="开启搜索功能"
                checked={isSearchable}
                onChange={(e: any) => handleToggleSearchable(e.target.checked)}}
              />
            </FormField>
          </div>

          {isSearchable && (
            <div className="search-details">
              <h3>搜索信息设置</h3>
              <p className="search-note">
                以下信息将用于搜索，请谨慎填写。建议使用昵称而非真实姓名。
              </p>

              <FormField
                label="搜索昵称"
                error={errors.searchNickname}
                required
                helpText="其他人搜索时看到的昵称，建议使用昵称而非真实姓名"
              >
                <FormInput
                  register={register('searchNickname')}
                  type="text"
                  placeholder="请输入昵称"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField
                label="学校名称"
                error={errors.schoolName}
                helpText="可选，帮助其他人确认身份"
              >
                <FormInput
                  register={register('schoolName')}
                  type="text"
                  placeholder="请输入学校名称"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField
                label="班级名称"
                error={errors.className}
                helpText="可选，帮助其他人确认身份"
              >
                <FormInput
                  register={register('className')}
                  type="text"
                  placeholder="请输入班级名称"
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          )}}

          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </form>
      </Card>

      {/* 搜索功能说明模态框 */}
      {showExplanation && explanation && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{explanation.title}</h2>
            
            <div className="explanation-content">
              <h3>功能说明</h3>
              <ul>
                {explanation.content.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}}
              </ul>

              <h3>潜在风险</h3>
              <ul>
                {explanation.risks.map((risk: string, index: number) => (
                  <li key={index} className="risk-item">{risk}</li>
                ))}}
              </ul>

              <h3>使用好处</h3>
              <ul>
                {explanation.benefits.map((benefit: string, index: number) => (
                  <li key={index} className="benefit-item">{benefit}</li>
                ))}}
              </ul>
            </div>

            <div className="modal-actions">
              <Button
                variant="ghost"
                onClick={() => setShowExplanation(false)}}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmExplanation}
              >
                我了解了，开启搜索
              </Button>
            </div>
          </div>
        </div>
      )}}

      {/* 当前设置状态 */}
      <Card heading="当前设置状态">
        <div className="settings-status">
          <div className="status-item">
            <span className="status-label">搜索状态:</span>
            <Badge
              text={isSearchable ? '已开启' : '已关闭'}
              tone={isSearchable ? 'success' : 'info'}
            />
          </div>
          
          {isSearchable && (
            <>
              <div className="status-item">
                <span className="status-label">搜索昵称:</span>
                <span className="status-value">{watch('searchNickname') || '未设置'}</span>
              </div>
              <div className="status-item">
                <span className="status-label">学校名称:</span>
                <span className="status-value">{watch('schoolName') || '未设置'}</span>
              </div>
              <div className="status-item">
                <span className="status-label">班级名称:</span>
                <span className="status-value">{watch('className') || '未设置'}</span>
              </div>
            </>
          )}}
        </div>
      </Card>

      {/* 隐私保护说明 */}
      <Card heading="隐私保护说明" className="privacy-info">
        <div className="privacy-content">
          <h3>我们如何保护您的隐私</h3>
          <ul>
            <li>搜索时只显示您设置的昵称和学校信息，不会暴露真实姓名</li>
            <li>即使被搜索到，其他人也需要您的同意才能关注您</li>
            <li>您可以随时关闭搜索功能，关闭后立即生效</li>
            <li>您可以随时撤销任何人的关注权限</li>
            <li>所有搜索和关注行为都有详细的审计记录</li>
          </ul>
          
          <h3>建议的安全设置</h3>
          <ul>
            <li>使用昵称而非真实姓名作为搜索昵称</li>
            <li>学校信息可以填写大概范围，不需要过于具体</li>
            <li>定期检查关注您的人，及时撤销不需要的关注</li>
            <li>如果发现异常情况，请立即联系我们</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}


