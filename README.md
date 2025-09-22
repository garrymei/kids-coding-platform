 # 🎓 儿童编程教育平台 (Kids Coding Platform)

面向 **10–15 岁学生** 的编程学习平台，结合 **微信小程序 + iOS/Android 原生 App**，采用 **游戏化 + 可视化编程（Blockly）+ 代码进阶** 的方式，让孩子逐步学习 Python/JavaScript 编程基础，同时为家长和教师提供可视化的监督与反馈工具。

---

## ✨ 项目目标
- 提供一个 **寓教于乐** 的编程学习环境。
- 通过 **养成+闯关** 激励机制提高学习兴趣。
- 支持 **多角色：学生 / 家长 / 教师 / 管理员**。
- 保证 **安全性**（未成年人保护、代码沙盒运行、内容审核）。

---

## 📌 功能模块

### 学生端
- **首页**：今日任务卡片 / 学习进度条 / 快捷入口。
- **课程列表**：章节分组、难度标识、解锁状态。
- **编程实验室**：Blockly 拖拽 → 代码视图；运行/重置；输出面板。
- **挑战关卡**：任务目标、通关条件校验、奖励结算。
- **成就中心**：等级、徽章、称号、虚拟宠物。
- **学习地图**：主线/支线关卡，点亮路径。
- **作品创作与分享**：提交作品、运行入口、Remix、点赞评论。

### 家长端
- **仪表盘**：学习时长、进度、徽章、近期活跃。
- **作品查看**：查看孩子作品与老师评语。
- **趋势与画像**：能力雷达、时间趋势。
- **报告导出**：周/月 PDF 报告。

### 教师端
- **教师首页**：班级总览、待批改任务。
- **学生列表**：进度矩阵、筛选落后学生。
- **学生详情**：代码快照、提交历史、通关记录。
- **点评工作流**：批注与模板语。
- **教学报告**：班级概览、分布图、优秀案例。

### 管理与运维
- **权限与隐私**：学生数据隔离、评论与作品审核。
- **沙盒执行**：容器化运行，限制资源与时长。
- **监控与日志**：运行日志、行为审计。

---

## 🏗 技术架构

- **前端**：
  - 学生/家长/教师端：Taro + React (跨端: 微信小程序 / iOS / Android)
  - 管理后台：React/Vue + Ant Design
- **后端**：
  - API 服务：Node.js (Express/NestJS) 或 Python (FastAPI)
  - WebSocket 实时通信（推送运行结果、消息）
  - 代码执行沙盒：Docker 池，限制 CPU/Mem/超时
- **数据库**：
  - PostgreSQL / MySQL：业务数据
  - Redis：缓存 & 排行榜
- **CI/CD**：
  - GitHub Actions / Jenkins
  - Docker/K8s 部署

---

## 📂 项目目录结构

```
kids-coding-platform/
├─ apps/
│  ├─ student-app/
│  ├─ parent-app/
│  ├─ teacher-app/
│  └─ admin-dashboard/
├─ server/
│  ├─ api/
│  ├─ executor/
│  └─ websocket/
├─ packages/
│  ├─ ui-kit/
│  ├─ blockly-extensions/
│  └─ utils/
├─ docs/
│  ├─ PRD/
│  ├─ designs/
│  └─ workflows/
├─ scripts/
├─ docker/
├─ README.md
└─ pnpm-workspace.yaml
```

## 🚀 快速启动

```bash
# 克隆后的一键体验
make dev

# 另起终端查看 API、执行器、学生端日志

# 关闭服务
make db-down
```

> `make dev` 会执行 pnpm 安装、启动数据库（Docker）、并并行启动 API（NestJS）、执行器（Docker sandbox）与学生端前端（Vite）。

常用命令：

| 命令        | 说明                               |
|-------------|------------------------------------|
| `make lint` | 执行仓库统一的 ESLint 规则         |
| `make test` | 运行各包内的 `test` 脚本（如有）   |
| `make build`| 运行所有包的构建流程               |
| `make db-up`/`make db-down` | 单独控制本地 Postgres |
