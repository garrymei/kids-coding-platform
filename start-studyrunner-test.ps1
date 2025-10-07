# Kids Coding Platform - StudyRunner 测试启动脚本
# 只启动 API 和学生端应用用于测试 StudyRunner

Write-Host "================================" -ForegroundColor Green
Write-Host "StudyRunner 测试环境启动" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# 项目根目录
$projectRoot = "F:\project\kids-coding-platform"

# 启动后端 API
Write-Host "[1/2] 启动后端 API 服务..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\server\api'; Write-Host 'API 服务启动中...' -ForegroundColor Yellow; pnpm dev"

Write-Host "等待 3 秒..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# 启动学生端应用
Write-Host "[2/2] 启动学生端应用..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\apps\student-app'; Write-Host '学生端应用启动中...' -ForegroundColor Yellow; pnpm dev"

Write-Host ""
Write-Host "✅ 服务启动命令已执行！" -ForegroundColor Green
Write-Host ""
Write-Host "请等待约 10-20 秒让服务完全启动..." -ForegroundColor Yellow
Write-Host ""
Write-Host "服务地址:" -ForegroundColor Cyan
Write-Host "  🔌 后端 API:    http://localhost:3000" -ForegroundColor White
Write-Host "  📱 学生端应用:  http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "测试 StudyRunner:" -ForegroundColor Cyan
Write-Host "  访问: http://localhost:5173/test" -ForegroundColor White
Write-Host "  然后点击任意游戏按钮开始测试" -ForegroundColor White
Write-Host ""
Write-Host "直接访问关卡示例:" -ForegroundColor Cyan
Write-Host "  http://localhost:5173/learn/python/maze_navigator/1" -ForegroundColor White
Write-Host ""
Write-Host "服务已启动！您可以关闭此窗口。" -ForegroundColor Gray

