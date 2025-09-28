# 结构化日志规范

## 字段
- ts (ISO)
- level (debug|info|warn|error)
- msg
- traceId
- userId (可空)
- execId (执行流水，可空)
- durationMs (可空)
- route (可空)
- meta (对象)

## 示例
```json
{"ts":"2025-09-19T09:00:00.000Z","level":"info","msg":"execute success","traceId":"trc_1","userId":"stu_123","execId":"run_abc123","durationMs":120,"route":"POST /execute","meta":{"lang":"python"}}
```