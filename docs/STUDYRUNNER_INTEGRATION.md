# StudyRunner 课程学习组件集成文档

## 📋 概述

已成功将 `kids-coding-platform-addon-v1` 中的 StudyRunner 组件集成到学生端应用中，并完成路由配置。

## ✅ 完成的工作

### 1. 创建学习页面组件

- **文件**: `apps/student-app/src/pages/Learn/LearnPage.tsx`
- **功能**:
  - 接收 URL 参数 (language, game, level)
  - 参数验证和错误处理
  - 渲染 StudyRunner 组件

### 2. 更新路由配置

- **文件**: `apps/student-app/src/routes.tsx`
- **新增路由**:
  ```typescript
  {
    path: 'learn/:language/:game/:level',
    element: withSuspense(<LearnPage />, '关卡加载中...'),
  }
  ```

### 3. 优化 StudyRunner 组件

- **文件**: `apps/student-app/src/components/StudyRunner.tsx`
- **改进内容**:
  - ✅ 使用项目现有的样式类 (`.card`, `.btn`, `.alert` 等)
  - ✅ 添加加载和错误状态处理
  - ✅ 添加代码重置功能
  - ✅ 优化代码编辑器样式（深色主题，Fira Code 字体）
  - ✅ 添加参考答案警告提示
  - ✅ 通关后显示"下一关"按钮
  - ✅ 显示关卡提示（hints）
  - ✅ 改进用户反馈和交互体验

### 4. 添加测试入口

- **文件**: `apps/student-app/src/pages/TestPage.tsx`
- **功能**: 在测试页面添加了快速访问按钮，方便测试 6 个游戏（Python 和 JavaScript 各 3 个）

## 🚀 如何使用

### URL 格式

```
/learn/:language/:game/:level
```

### 参数说明

- `language`: 编程语言，支持 `python` 或 `javascript`
- `game`: 游戏类型，支持：
  - `maze_navigator` - 迷宫导航
  - `turtle_artist` - 海龟画家
  - `robot_sorter` - 机器人分拣
- `level`: 关卡编号（1-10）

### 示例 URL

```
/learn/python/maze_navigator/1
/learn/javascript/turtle_artist/5
/learn/python/robot_sorter/10
```

## 🧪 测试方法

### 方法 1：通过测试页面

1. 启动学生端应用：

   ```bash
   pnpm --filter student-app dev
   ```

2. 访问测试页面：

   ```
   http://localhost:5173/test
   ```

3. 点击任意游戏按钮开始测试

### 方法 2：直接访问 URL

```
http://localhost:5173/learn/python/maze_navigator/1
```

### 方法 3：确保后端 API 运行

StudyRunner 需要连接到后端 API 来获取关卡数据：

```bash
# 启动后端 API
pnpm --filter api dev
```

后端将在 `http://localhost:3000` 运行，提供以下端点：

- `GET /api/curriculum/:language/:game/:level` - 获取关卡数据
- `POST /api/execute` - 执行代码
- `POST /api/judge` - 判题

## 📊 功能特性

### StudyRunner 组件功能

- ✅ **关卡信息展示**: 标题、故事、目标
- ✅ **代码编辑器**: 支持实时编辑，深色主题
- ✅ **代码重置**: 一键恢复起始代码
- ✅ **运行并判题**: 提交代码执行和自动判题
- ✅ **参考答案**: 可查看/隐藏参考解决方案
- ✅ **执行日志**: 实时显示运行结果
- ✅ **通关反馈**: 清晰的成功/失败状态
- ✅ **下一关导航**: 通关后自动提示下一关
- ✅ **提示系统**: 显示关卡提示帮助学习
- ✅ **错误处理**: 完善的加载和错误状态处理

## 🎮 支持的游戏和关卡

### Python (共 30 关)

- 🧭 **迷宫导航** (maze_navigator) - 10 关
- 🐢 **海龟画家** (turtle_artist) - 10 关
- 🤖 **机器人分拣** (robot_sorter) - 10 关

### JavaScript (共 30 关)

- 🧭 **迷宫导航** (maze_navigator) - 10 关
- 🐢 **海龟画家** (turtle_artist) - 10 关
- 🤖 **机器人分拣** (robot_sorter) - 10 关

**总计**: 60 关卡

## 🔌 API 集成

### 前端服务层

- `apps/student-app/src/services/api.ts` - HTTP 客户端
- `apps/student-app/src/services/curriculum.ts` - 课程 API
- `apps/student-app/src/services/judge.ts` - 判题 API

### 后端模块

- `server/api/src/modules/curriculum/` - 课程模块
- `server/api/src/modules/judge/` - 判题模块
- `server/api/src/modules/execute/` - 执行模块

### 判题类型

1. **api_events** (迷宫导航)
   - 检测是否到达终点
   - 验证步数限制

2. **svg_path_similarity** (海龟画家)
   - 对比绘制路径段数
   - 验证角度和长度

3. **unit_tests** (机器人分拣)
   - 结果与期望值对比
   - 支持扩展为沙盒执行

## 📁 文件清单

### 新增文件

- `apps/student-app/src/pages/Learn/LearnPage.tsx`
- `docs/STUDYRUNNER_INTEGRATION.md` (本文件)

### 修改文件

- `apps/student-app/src/routes.tsx` - 添加 `/learn/:language/:game/:level` 路由
- `apps/student-app/src/components/StudyRunner.tsx` - 优化样式和功能
- `apps/student-app/src/pages/TestPage.tsx` - 添加测试入口

### 现有集成文件（已就位）

- `apps/student-app/src/services/api.ts`
- `apps/student-app/src/services/curriculum.ts`
- `apps/student-app/src/services/judge.ts`
- `server/api/src/modules/curriculum/`
- `server/api/src/modules/judge/`
- `server/api/src/modules/execute/`
- `server/api/src/data/curriculum/` (关卡数据)

## 🎨 样式说明

### 使用的样式类

- `.card` - 卡片容器
- `.btn`, `.btn-primary`, `.btn-secondary` - 按钮
- `.alert`, `.alert-success`, `.alert-warning`, `.alert-error` - 提示框
- `.kc-section-title` - 章节标题
- `.text-muted` - 次要文本

### 自定义样式

- 代码编辑器：深色主题 (#1e1e1e 背景)
- 目标区域：浅蓝色背景 (#f0f7ff)
- 参考答案警告：浅黄色背景 (#fff3cd)

## 🔧 后续优化建议

1. **代码编辑器增强**
   - 集成 Monaco Editor 或 CodeMirror
   - 添加语法高亮
   - 添加代码补全

2. **可视化增强**
   - 迷宫导航：添加网格可视化
   - 海龟画家：添加 Canvas 绘图预览
   - 机器人分拣：添加动画演示

3. **功能扩展**
   - 保存进度到数据库
   - 记录代码历史版本
   - 添加代码分享功能
   - 集成星级评价系统

4. **性能优化**
   - 添加代码缓存（localStorage）
   - 优化 API 请求频率
   - 添加离线支持

## 🐛 故障排除

### 问题：页面显示"加载关卡失败"

**解决方案**:

1. 确认后端 API 已启动 (`pnpm --filter api dev`)
2. 检查 API 地址是否正确
3. 查看浏览器控制台的网络请求错误

### 问题：路由无法访问

**解决方案**:

1. 确认前端应用已重新编译
2. 清除浏览器缓存
3. 检查 URL 参数格式是否正确

### 问题：代码编辑器样式异常

**解决方案**:

1. 确认已导入项目的全局样式
2. 检查 CSS 变量是否定义
3. 尝试硬刷新（Ctrl+Shift+R）

## 📞 联系与支持

如有问题，请查看：

- 项目 README: `/README.md`
- API 文档: `/docs/api/`
- 架构决策: `/docs/adr/`

---

**文档版本**: 1.0  
**最后更新**: 2025-10-07  
**状态**: ✅ 已完成并测试
