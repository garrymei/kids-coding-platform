# UI组件设计规范

## 概述

本文档定义了家长/老师查看学生数据功能中使用的UI组件的设计规范，包括组件结构、样式定义、交互行为等详细规范。

## 设计系统

### 1. 颜色系统

#### 1.1 主色调

```css
:root {
  /* 主色 */
  --primary-color: #1890ff;
  --primary-hover: #40a9ff;
  --primary-active: #096dd9;

  /* 成功色 */
  --success-color: #52c41a;
  --success-hover: #73d13d;
  --success-active: #389e0d;

  /* 警告色 */
  --warning-color: #faad14;
  --warning-hover: #ffc53d;
  --warning-active: #d48806;

  /* 错误色 */
  --error-color: #ff4d4f;
  --error-hover: #ff7875;
  --error-active: #d9363e;

  /* 信息色 */
  --info-color: #13c2c2;
  --info-hover: #36cfc9;
  --info-active: #08979c;
}
```

#### 1.2 中性色

```css
:root {
  /* 文字颜色 */
  --text-primary: #262626;
  --text-secondary: #595959;
  --text-tertiary: #8c8c8c;
  --text-quaternary: #bfbfbf;

  /* 背景颜色 */
  --bg-primary: #ffffff;
  --bg-secondary: #fafafa;
  --bg-tertiary: #f5f5f5;
  --bg-quaternary: #f0f0f0;

  /* 边框颜色 */
  --border-primary: #d9d9d9;
  --border-secondary: #e8e8e8;
  --border-tertiary: #f0f0f0;
}
```

#### 1.3 状态颜色

```css
:root {
  /* 权限状态 */
  --status-pending: #faad14;
  --status-active: #52c41a;
  --status-revoked: #ff4d4f;
  --status-expired: #d9d9d9;

  /* 数据范围 */
  --scope-progress: #1890ff;
  --scope-completion: #52c41a;
  --scope-code: #722ed1;
  --scope-time: #fa8c16;
  --scope-achievement: #eb2f96;
}
```

### 2. 字体系统

#### 2.1 字体族

```css
:root {
  --font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans',
    sans-serif;
  --font-family-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
}
```

#### 2.2 字体大小

```css
:root {
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  --font-size-4xl: 36px;
}
```

#### 2.3 行高

```css
:root {
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

### 3. 间距系统

#### 3.1 基础间距

```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;
}
```

#### 3.2 组件间距

```css
:root {
  --component-padding-sm: var(--spacing-sm) var(--spacing-md);
  --component-padding-md: var(--spacing-md) var(--spacing-lg);
  --component-padding-lg: var(--spacing-lg) var(--spacing-xl);

  --component-margin-sm: var(--spacing-sm);
  --component-margin-md: var(--spacing-md);
  --component-margin-lg: var(--spacing-lg);
}
```

### 4. 圆角系统

```css
:root {
  --border-radius-sm: 4px;
  --border-radius-md: 6px;
  --border-radius-lg: 8px;
  --border-radius-xl: 12px;
  --border-radius-2xl: 16px;
  --border-radius-full: 50%;
}
```

### 5. 阴影系统

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

---

## 核心组件规范

### 1. 权限范围选择器 (PermissionScopeSelector)

#### 1.1 组件结构

```typescript
interface PermissionScopeSelectorProps {
  scopes: PermissionScope[];
  selected: PermissionScope[];
  onChange: (scopes: PermissionScope[]) => void;
  disabled?: boolean;
  showDescription?: boolean;
  size?: 'small' | 'medium' | 'large';
}
```

#### 1.2 样式规范

```css
.permission-scope-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.permission-scope-selector .scope-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 1px solid var(--border-secondary);
  border-radius: var(--border-radius-md);
  background: var(--bg-primary);
  transition: all 0.2s ease;
}

.permission-scope-selector .scope-item:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.permission-scope-selector .scope-item.selected {
  border-color: var(--primary-color);
  background: rgba(24, 144, 255, 0.04);
}

.permission-scope-selector .scope-info {
  flex: 1;
}

.permission-scope-selector .scope-name {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.permission-scope-selector .scope-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}
```

#### 1.3 交互行为

- 点击复选框切换选择状态
- 悬停时显示边框高亮
- 选中状态显示背景色变化
- 禁用状态显示灰色样式

### 2. 到期时间选择器 (ExpiryTimeSelector)

#### 2.1 组件结构

```typescript
interface ExpiryTimeSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}
```

#### 2.2 样式规范

```css
.expiry-time-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.expiry-time-selector .radio-group {
  display: flex;
  gap: var(--spacing-lg);
}

.expiry-time-selector .date-picker {
  margin-top: var(--spacing-sm);
}

.expiry-time-selector .date-picker .ant-picker {
  width: 100%;
  border-radius: var(--border-radius-md);
  border-color: var(--border-primary);
}

.expiry-time-selector .date-picker .ant-picker:hover {
  border-color: var(--primary-color);
}

.expiry-time-selector .date-picker .ant-picker-focused {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
```

### 3. 状态指示器 (StatusIndicator)

#### 3.1 组件结构

```typescript
interface StatusIndicatorProps {
  status: 'pending' | 'active' | 'revoked' | 'expired';
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  showIcon?: boolean;
}
```

#### 3.2 样式规范

```css
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.status-indicator.size-small {
  padding: 2px var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.status-indicator.size-large {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
}

.status-indicator.status-pending {
  background: rgba(250, 173, 20, 0.1);
  color: var(--status-pending);
  border: 1px solid rgba(250, 173, 20, 0.2);
}

.status-indicator.status-active {
  background: rgba(82, 196, 26, 0.1);
  color: var(--status-active);
  border: 1px solid rgba(82, 196, 26, 0.2);
}

.status-indicator.status-revoked {
  background: rgba(255, 77, 79, 0.1);
  color: var(--status-revoked);
  border: 1px solid rgba(255, 77, 79, 0.2);
}

.status-indicator.status-expired {
  background: rgba(217, 217, 217, 0.1);
  color: var(--status-expired);
  border: 1px solid rgba(217, 217, 217, 0.2);
}

.status-indicator .status-icon {
  font-size: 1.2em;
}

.status-indicator .status-text {
  white-space: nowrap;
}
```

### 4. 申请卡片 (RequestCard)

#### 4.1 组件结构

```typescript
interface RequestCardProps {
  request: {
    id: string;
    applicantName: string;
    applicantRole: 'parent' | 'teacher';
    requestScope: string[];
    requestTime: string;
    expiresAt: string;
    status: 'pending' | 'active' | 'revoked';
  };
  onViewDetails: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRevoke?: () => void;
}
```

#### 4.2 样式规范

```css
.request-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.request-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-primary);
}

.request-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.request-card .applicant-info {
  flex: 1;
}

.request-card .applicant-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.request-card .applicant-role {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: 2px var(--spacing-xs);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  display: inline-block;
}

.request-card .card-content {
  margin-bottom: var(--spacing-lg);
}

.request-card .scope-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.request-card .scope-tag {
  padding: 2px var(--spacing-xs);
  background: rgba(24, 144, 255, 0.1);
  color: var(--primary-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
}

.request-card .time-info {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.request-card .card-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.request-card .action-button {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.request-card .action-button.primary {
  background: var(--primary-color);
  color: white;
}

.request-card .action-button.primary:hover {
  background: var(--primary-hover);
}

.request-card .action-button.secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-primary);
}

.request-card .action-button.secondary:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.request-card .action-button.danger {
  background: var(--error-color);
  color: white;
}

.request-card .action-button.danger:hover {
  background: var(--error-hover);
}
```

### 5. 数据图表容器 (ChartContainer)

#### 5.1 组件结构

```typescript
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
  actions?: React.ReactNode;
  height?: number;
}
```

#### 5.2 样式规范

```css
.chart-container {
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.chart-container .chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-tertiary);
}

.chart-container .chart-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.chart-container .chart-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.chart-container .chart-content {
  position: relative;
  min-height: 300px;
}

.chart-container .chart-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: var(--text-tertiary);
}

.chart-container .chart-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: var(--error-color);
}

.chart-container .chart-error .error-icon {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-md);
}

.chart-container .chart-error .error-message {
  font-size: var(--font-size-base);
  text-align: center;
}
```

### 6. 搜索输入框 (SearchInput)

#### 6.1 组件结构

```typescript
interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}
```

#### 6.2 样式规范

```css
.search-input {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input .input-wrapper {
  position: relative;
  flex: 1;
}

.search-input .ant-input {
  width: 100%;
  border-radius: var(--border-radius-md);
  border-color: var(--border-primary);
  padding-right: 40px;
}

.search-input .ant-input:hover {
  border-color: var(--primary-color);
}

.search-input .ant-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.search-input .search-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--primary-color);
  border: none;
  border-radius: var(--border-radius-sm);
  color: white;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-input .search-button:hover {
  background: var(--primary-hover);
}

.search-input .search-button:disabled {
  background: var(--text-quaternary);
  cursor: not-allowed;
}
```

---

## 响应式设计规范

### 1. 断点系统

```css
:root {
  --breakpoint-xs: 480px;
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
  --breakpoint-2xl: 1600px;
}

/* 移动端 */
@media (max-width: 767px) {
  .permission-scope-selector {
    gap: var(--spacing-sm);
  }

  .permission-scope-selector .scope-item {
    padding: var(--spacing-sm);
  }

  .request-card {
    padding: var(--spacing-md);
  }

  .request-card .card-actions {
    flex-direction: column;
  }

  .request-card .action-button {
    width: 100%;
    justify-content: center;
  }
}

/* 平板端 */
@media (min-width: 768px) and (max-width: 991px) {
  .chart-container {
    padding: var(--spacing-md);
  }

  .chart-container .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
}

/* 桌面端 */
@media (min-width: 992px) {
  .permission-scope-selector {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-md);
  }
}
```

### 2. 移动端优化

#### 2.1 触摸友好

```css
.touch-friendly {
  min-height: 44px;
  min-width: 44px;
}

.touch-friendly .action-button {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
}
```

#### 2.2 手势支持

```css
.swipeable {
  touch-action: pan-x;
  user-select: none;
}

.swipeable .swipe-indicator {
  position: absolute;
  left: 50%;
  bottom: -10px;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: var(--border-primary);
  border-radius: 2px;
}
```

---

## 无障碍设计规范

### 1. 键盘导航

```css
.focusable:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.focusable:focus:not(:focus-visible) {
  outline: none;
}

.focusable:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
```

### 2. 屏幕阅读器支持

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.aria-live {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
```

### 3. 高对比度模式

```css
@media (prefers-contrast: high) {
  .permission-scope-selector .scope-item {
    border-width: 2px;
  }

  .status-indicator {
    border-width: 2px;
  }

  .request-card {
    border-width: 2px;
  }
}
```

---

## 动画和过渡

### 1. 基础动画

```css
:root {
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;
}

.animate-fade-in {
  animation: fadeIn var(--transition-normal);
}

.animate-slide-up {
  animation: slideUp var(--transition-normal);
}

.animate-scale-in {
  animation: scaleIn var(--transition-fast);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 2. 加载动画

```css
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-primary);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-dots {
  display: inline-flex;
  gap: 4px;
}

.loading-dots .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-color);
  animation: pulse 1.4s ease-in-out infinite both;
}

.loading-dots .dot:nth-child(1) {
  animation-delay: -0.32s;
}
.loading-dots .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
```

---

**文档版本**: v1.0  
**最后更新**: 2024-01-03  
**维护人员**: 设计团队
