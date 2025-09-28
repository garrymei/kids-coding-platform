import { useState, useEffect } from 'react';
import { Card, Button } from '@kids/ui-kit';
import { settingsStore, type Settings } from '../store/settings';

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(settingsStore.getSettings());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // 监听设置变化
    const handleSettingsChange = () => {
      setSettings(settingsStore.getSettings());
    };

    // 监听自定义事件
    const handleCustomEvent = (event: CustomEvent) => {
      setSettings(event.detail);
    };

    window.addEventListener('settingsChanged', handleCustomEvent as EventListener);
    
    // 定期检查设置变化（简单实现）
    const interval = setInterval(handleSettingsChange, 1000);
    return () => {
      window.removeEventListener('settingsChanged', handleCustomEvent as EventListener);
      clearInterval(interval);
    };
  }, []);

  const handleSettingChange = (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    // Remove updatedAt from the settings to save
    const { updatedAt, ...settingsToSave } = settings;
    settingsStore.updateSettings(settingsToSave);
    setHasChanges(false);
    
    // 显示保存成功提示
    alert('设置已保存！');
  };

  const handleReset = () => {
    const defaultSettings: Settings = {
      sfxEnabled: true,
      colorWeakMode: false,
      reduceMotion: false,
      updatedAt: new Date().toISOString(),
    };
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const handlePreview = () => {
    // 触发预览效果
    alert('预览效果已应用！');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Card heading="⚙️ 设置中心">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* 音效设置 */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8faff', 
            borderRadius: '10px',
            border: '1px solid #e0e7ff'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1e40af' }}>🔊 音效设置</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Using native HTML checkbox instead of Switch component */}
              <input
                type="checkbox"
                checked={settings.sfxEnabled}
                onChange={(e) => handleSettingChange('sfxEnabled', e.target.checked)}
                style={{ 
                  width: '44px',
                  height: '44px',
                  cursor: 'pointer'
                }}
                aria-label="启用音效"
              />
              <span style={{ 
                fontSize: '16px',
                cursor: 'pointer',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center'
              }} onClick={() => handleSettingChange('sfxEnabled', !settings.sfxEnabled)}>
                启用音效
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                控制游戏音效和提示音的播放
              </span>
            </div>
          </div>

          {/* 无障碍设置 */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f0fdf4', 
            borderRadius: '10px',
            border: '1px solid #bbf7d0'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#166534' }}>♿ 无障碍设置</h3>
            
            {/* 色弱模式 */}
            <div style={{ 
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #d1d5db'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <input
                  type="checkbox"
                  checked={settings.colorWeakMode}
                  onChange={(e) => handleSettingChange('colorWeakMode', e.target.checked)}
                  style={{ 
                    width: '44px',
                    height: '44px',
                    cursor: 'pointer'
                  }}
                  aria-label="色弱友好模式"
                />
                <span style={{ 
                  fontSize: '16px',
                  cursor: 'pointer',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center'
                }} onClick={() => handleSettingChange('colorWeakMode', !settings.colorWeakMode)}>
                  色弱友好模式
                </span>
                <span style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>
                  调整颜色对比度，提高可读性
                </span>
              </div>
              {settings.colorWeakMode && (
                <div style={{ 
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '5px',
                  fontSize: '14px',
                  color: '#92400e'
                }}>
                  💡 色弱模式已启用，界面颜色已优化
                </div>
              )}
            </div>

            {/* 动效减弱 */}
            <div style={{ 
              padding: '15px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #d1d5db'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <input
                  type="checkbox"
                  checked={settings.reduceMotion}
                  onChange={(e) => handleSettingChange('reduceMotion', e.target.checked)}
                  style={{ 
                    width: '44px',
                    height: '44px',
                    cursor: 'pointer'
                  }}
                  aria-label="减少动效"
                />
                <span style={{ 
                  fontSize: '16px',
                  cursor: 'pointer',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center'
                }} onClick={() => handleSettingChange('reduceMotion', !settings.reduceMotion)}>
                  减少动效
                </span>
                <span style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>
                  减少动画效果，降低视觉干扰
                </span>
              </div>
              {settings.reduceMotion && (
                <div style={{ 
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '5px',
                  fontSize: '14px',
                  color: '#92400e'
                }}>
                  💡 动效减弱已启用，动画效果已简化
                </div>
              )}
            </div>
          </div>

          {/* 设置预览 */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#fef7ff', 
            borderRadius: '10px',
            border: '1px solid #e9d5ff'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#7c3aed' }}>👀 设置预览</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '15px' 
            }}>
              <div style={{ 
                padding: '10px',
                backgroundColor: settings.colorWeakMode ? '#fef3c7' : '#dbeafe',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>颜色模式</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {settings.colorWeakMode ? '色弱友好' : '标准模式'}
                </div>
              </div>
              <div style={{ 
                padding: '10px',
                backgroundColor: settings.sfxEnabled ? '#d1fae5' : '#fee2e2',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>音效状态</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {settings.sfxEnabled ? '已启用' : '已禁用'}
                </div>
              </div>
              <div style={{ 
                padding: '10px',
                backgroundColor: settings.reduceMotion ? '#fef3c7' : '#dbeafe',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>动效模式</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {settings.reduceMotion ? '简化动效' : '完整动效'}
                </div>
              </div>
            </div>
            
            {/* 预览组件示例 */}
            <div style={{ 
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px dashed #d1d5db'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#4b5563' }}>立即预览示例组件</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={handlePreview}>
                  按钮示例
                </Button>
                <div style={{ 
                  width: '100px', 
                  height: '50px', 
                  backgroundColor: settings.colorWeakMode ? '#f59e0b' : '#3b82f6',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  transition: settings.reduceMotion ? 'none' : 'all 0.3s ease'
                }}>
                  图表示例
                </div>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    backgroundColor: settings.reduceMotion ? '#10b981' : '#8b5cf6',
                    borderRadius: settings.reduceMotion ? '0' : '50%',
                    transition: settings.reduceMotion ? 'none' : 'all 0.3s ease'
                  }}></div>
                  <span>过渡示例</span>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'center',
            padding: '20px 0'
          }}>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges}
              style={{
                backgroundColor: hasChanges ? '#10b981' : '#9ca3af',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: hasChanges ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
                minHeight: '44px'
              }}
            >
              {hasChanges ? '💾 保存设置' : '✅ 已保存'}
            </Button>
            
            <Button 
              onClick={handleReset}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                minHeight: '44px'
              }}
            >
              🔄 重置为默认
            </Button>
            
            <Button 
              onClick={() => window.history.back()}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                minHeight: '44px'
              }}
            >
              ← 返回
            </Button>
          </div>

          {/* 帮助信息 */}
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '8px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>💡 设置说明</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>音效设置</strong>：控制游戏中的音效和提示音播放</li>
              <li><strong>色弱友好模式</strong>：调整界面颜色对比度，提高可读性</li>
              <li><strong>减少动效</strong>：简化动画效果，减少视觉干扰</li>
              <li>设置会自动保存到本地，下次访问时会自动应用</li>
              <li><strong>无障碍对比度</strong>：主文本对比度 ≥ 4.5:1；可交互控件高度 ≥ 44px</li>
              <li><strong>图表附冗余编码</strong>：颜色+纹理/标记点（便于色弱）</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}