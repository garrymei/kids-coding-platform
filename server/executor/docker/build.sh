#!/bin/bash

# 构建 Docker 镜像脚本
set -e

echo "🐳 构建 kids-code-python 容器镜像..."

# 构建镜像
docker build -t kids-code-python:latest .

echo "✅ 镜像构建完成"

# 测试镜像
echo "🧪 测试镜像..."
docker run --rm kids-code-python:latest python3 -c "import sys; print(f'Python {sys.version}')"

echo "🎉 镜像测试通过！"
echo ""
echo "使用方法："
echo "  docker run --rm --network none --memory=128m --cpus=0.5 kids-code-python:latest python3 -c 'print(\"Hello World\")'"
