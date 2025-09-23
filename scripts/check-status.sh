#!/usr/bin/env bash
set -euo pipefail

echo "🔍 检查项目状态..."
echo ""

# 检查端口占用
check_port() {
    local port=$1
    local service=$2
    if lsof -i :$port >/dev/null 2>&1; then
        echo "✅ $service (端口 $port) - 运行中"
    else
        echo "❌ $service (端口 $port) - 未运行"
    fi
}

echo "📡 服务状态检查："
check_port 3000 "API 服务"
check_port 3001 "WebSocket 服务"
check_port 5173 "学生端应用"
check_port 5174 "家长端应用"
check_port 5175 "教师端应用"
check_port 5432 "PostgreSQL 数据库"
check_port 5555 "Prisma Studio"

echo ""
echo "🔧 开发工具检查："

# 检查 Node.js 版本
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js $(node --version)"
else
    echo "❌ Node.js 未安装"
fi

# 检查 pnpm 版本
if command -v pnpm >/dev/null 2>&1; then
    echo "✅ pnpm $(pnpm --version)"
else
    echo "❌ pnpm 未安装"
fi

# 检查 Docker
if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        echo "✅ Docker 运行中"
    else
        echo "❌ Docker 未运行"
    fi
else
    echo "❌ Docker 未安装"
fi

echo ""
echo "📦 包状态检查："

# 检查依赖安装
if [ -d "node_modules" ]; then
    echo "✅ 根依赖已安装"
else
    echo "❌ 根依赖未安装 (运行: pnpm install)"
fi

# 检查各包构建状态
echo ""
echo "🏗️ 构建状态检查："

check_build() {
    local package=$1
    local path=$2
    if [ -d "$path/dist" ]; then
        echo "✅ $package - 已构建"
    else
        echo "⚠️  $package - 未构建 (运行: pnpm build)"
    fi
}

check_build "API" "packages/api"
check_build "UI Kit" "packages/ui-kit"
check_build "Utils" "packages/utils"
check_build "Blockly Extensions" "packages/blockly-extensions"
check_build "Executor" "server/executor"
check_build "WebSocket" "server/websocket"

echo ""
echo "🎯 快速测试："

# 测试 API 健康检查
if curl -s http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ API 健康检查通过"
else
    echo "❌ API 健康检查失败"
fi

# 测试数据库连接
if curl -s http://localhost:3000/health | grep -q '"database":"up"'; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接异常"
fi

echo ""
echo "📋 下一步操作："
echo "1. 如果服务未运行，执行: make dev"
echo "2. 如果依赖未安装，执行: pnpm install"
echo "3. 如果构建失败，执行: pnpm build"
echo "4. 查看详细日志: make logs"

