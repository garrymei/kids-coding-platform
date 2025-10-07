# StudyRunner 测试环境启动说明

## ✅ 已完成的操作

我已经为您启动了两个 PowerShell 窗口：

1. **窗口 1**: 后端 API 服务 (`server/api`)
2. **窗口 2**: 学生端应用 (`apps/student-app`)

## 📝 下一步操作

### 1. 检查服务状态

请查看刚才打开的两个 PowerShell 窗口：

#### 窗口 1 - 后端 API

- 应该显示类似 `Nest application successfully started` 的信息
- 或者显示 `Listening on port 3000`
- ⚠️ 如果显示数据库连接错误，这是正常的（见下方说明）

#### 窗口 2 - 学生端应用

- 应该显示类似 `Local: http://localhost:5173/` 的信息
- 或者 `VITE v4.x.x ready in xxx ms`

### 2. 数据库相关（可选）

StudyRunner 的 **Curriculum API 不需要数据库**，因为它直接读取 JSON 文件。如果看到数据库连接错误，可以忽略。

如果需要完整功能（包括用户认证、进度保存等），请启动 Docker Desktop 并运行：

```powershell
cd F:\project\kids-coding-platform
docker compose -f docker/docker-compose.db.yml up -d
```

### 3. 访问测试页面

打开浏览器访问以下任一地址：

#### 测试入口页面（推荐）

```
http://localhost:5173/test
```

页面上有 6 个快速测试按钮（Python 和 JavaScript 各 3 个游戏）

#### 直接访问关卡

```
http://localhost:5173/learn/python/maze_navigator/1
http://localhost:5173/learn/javascript/turtle_artist/1
http://localhost:5173/learn/python/robot_sorter/1
```

## 🎮 可测试的游戏和关卡

### Python 游戏（每个 10 关）

- 🧭 **迷宫导航** (maze_navigator)
- 🐢 **海龟画家** (turtle_artist)
- 🤖 **机器人分拣** (robot_sorter)

### JavaScript 游戏（每个 10 关）

- 🧭 **迷宫导航** (maze_navigator)
- 🐢 **海龟画家** (turtle_artist)
- 🤖 **机器人分拣** (robot_sorter)

**总计 60 关卡可供测试！**

## 🐛 故障排除

### 问题 1: API 窗口显示 "Cannot connect to database"

**解决方案**:

- StudyRunner 的 Curriculum API 不需要数据库，可以忽略此错误
- Curriculum API 端点 `/api/curriculum/:language/:game/:level` 直接读取JSON文件
- 如需完整功能，启动 Docker Desktop 后运行数据库

### 问题 2: 学生端应用窗口显示错误

**解决方案**:

- 检查是否有端口占用（5173）
- 尝试在窗口中按 `Ctrl+C` 停止，然后重新运行 `pnpm dev`

### 问题 3: 浏览器显示 "无法连接"

**解决方案**:

- 确认两个 PowerShell 窗口中的服务都已启动
- 等待 30-60 秒让服务完全启动
- 检查控制台是否有错误信息

### 问题 4: 页面显示 "加载关卡失败"

**解决方案**:

- 检查 API 窗口是否有错误
- 确认文件路径正确：`server/api/src/data/curriculum/` 下有 JSON 文件
- 在浏览器开发者工具的 Network 标签中查看 API 请求状态

## 🔄 重新启动服务

如果需要重新启动：

### 方法 1: 使用启动脚本

```powershell
cd F:\project\kids-coding-platform
.\start-studyrunner-test.ps1
```

### 方法 2: 手动启动

**终端 1 - API:**

```powershell
cd F:\project\kids-coding-platform\server\api
pnpm dev
```

**终端 2 - 学生端:**

```powershell
cd F:\project\kids-coding-platform\apps\student-app
pnpm dev
```

## 📊 服务端口

| 服务                | 端口 | 地址                  |
| ------------------- | ---- | --------------------- |
| 后端 API            | 3000 | http://localhost:3000 |
| 学生端应用          | 5173 | http://localhost:5173 |
| 数据库 (PostgreSQL) | 5432 | localhost:5432 (可选) |
| Redis               | 6379 | localhost:6379 (可选) |

## 🎯 StudyRunner 功能测试清单

测试以下功能：

- [ ] 关卡信息正确显示（标题、故事、目标）
- [ ] 代码编辑器可以编辑
- [ ] "运行并判题" 按钮正常工作
- [ ] 执行日志正确显示
- [ ] "查看参考答案" 按钮正常工作
- [ ] "重置代码" 恢复起始代码
- [ ] 通关后显示"下一关"按钮
- [ ] 点击"下一关"正确跳转
- [ ] 提示系统正常显示

## 📚 相关文档

- 完整文档: `docs/STUDYRUNNER_INTEGRATION.md`
- API 文档: `docs/api/FRONTEND_API_CONTRACTS.md`
- 关卡数据: `server/api/src/data/curriculum/`

---

**祝测试顺利！** 🎉

如有问题，请查看 PowerShell 窗口中的错误信息，或检查浏览器开发者工具的控制台。
