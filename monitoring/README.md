# 监控配置

本目录包含儿童编程平台的监控配置文件和规则。

## 文件结构

```
monitoring/
├── README.md              # 本文件
├── prometheus.yml         # Prometheus配置
├── alertmanager.yml       # AlertManager配置
└── rules/                 # 告警规则
    ├── api.yml           # API服务告警规则
    └── executor.yml      # 执行器告警规则
```

## 使用方法

### 启动监控栈

```bash
make monitor:up
```

这将启动以下服务：
- **Prometheus**: http://localhost:9090 - 指标收集和查询
- **Grafana**: http://localhost:3000 - 可视化仪表板 (admin/admin)
- **AlertManager**: http://localhost:9093 - 告警管理

### 停止监控栈

```bash
make monitor:down
```

## 监控指标

### API服务指标
- HTTP请求总数和响应时间
- 错误率统计
- 数据库连接状态

### 执行器指标
- 执行任务总数和成功率
- 队列长度和等待时间
- 资源使用情况（CPU、内存）

## 告警规则

### API服务告警
- 服务不可用
- 高错误率 (>10%)
- 响应时间过长 (>2s)
- 请求量异常

### 执行器告警
- 服务不可用
- 高失败率 (>10%)
- 队列积压 (>50个任务)
- 执行时间过长 (>10s)
- 内存使用过高 (>200MB)

## 配置说明

### Prometheus配置
- 每15秒抓取一次指标
- 监控API、执行器、WebSocket服务
- 包含告警规则和AlertManager配置

### AlertManager配置
- 支持邮件和Webhook通知
- 告警分组和抑制规则
- 可配置通知渠道

## 自定义配置

如需修改监控配置，请编辑相应的YAML文件：

1. **修改抓取目标**: 编辑 `prometheus.yml` 中的 `scrape_configs`
2. **添加告警规则**: 在 `rules/` 目录下创建新的规则文件
3. **配置通知**: 修改 `alertmanager.yml` 中的通知设置

## 故障排除

### 常见问题

1. **端口冲突**: 确保9090、3000、9093端口未被占用
2. **Docker权限**: 确保有Docker运行权限
3. **配置文件错误**: 检查YAML语法是否正确

### 日志查看

```bash
# 查看Prometheus日志
docker logs prometheus

# 查看Grafana日志
docker logs grafana

# 查看AlertManager日志
docker logs alertmanager
```

