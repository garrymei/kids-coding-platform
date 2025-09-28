# 健康检查与指标枚举

## 健康
- GET /health ：存活
- GET /ready ：依赖可用（DB/Redis/Executor）

## /metrics（Prometheus）
- `executor_runs_total`
- `executor_run_duration_ms_avg`
- `executor_run_fail_ratio`
- `executor_queue_length`
- `api_http_requests_total`
- `api_http_request_duration_ms_avg`