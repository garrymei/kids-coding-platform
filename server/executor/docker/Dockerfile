# 基础镜像：Python 3.11 slim
FROM python:3.11-slim

# 设置工作目录
WORKDIR /sandbox

# 创建非 root 用户
RUN groupadd -r sandbox && useradd -r -g sandbox sandbox

# 安装白名单库（只安装安全的、必要的库）
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

# 创建只读目录结构
RUN mkdir -p /sandbox/data && \
    chown -R sandbox:sandbox /sandbox && \
    chmod -R 755 /sandbox

# 切换到非 root 用户
USER sandbox

# 设置环境变量
ENV PYTHONPATH=/sandbox
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# 默认命令
CMD ["python3", "-c", "print('Container ready')"]
