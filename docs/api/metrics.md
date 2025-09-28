# 学习指标 API（纵向/横向）

## 纵向趋势
GET /metrics/students/{studentId}/trend?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=day|week
Auth: student|parent|teacher
Rules:
- parent 需对该 student 有 active grant (scope 包含 metrics:read)
- teacher 需该 student 为本班 active

### 200
```json
{
  "studentId": "stu_123",
  "series": [
    {"date":"2025-09-01","time_spent_min":30,"tasks_done":6,"accuracy":0.86,"xp":50,"streak":5},
    {"date":"2025-09-02","time_spent_min":25,"tasks_done":5,"accuracy":0.80,"xp":40,"streak":6}
  ]
}
```

#### 4xx

- **403 no_grant**: 访问被拒绝（没有有效授权）
- **404 student_not_found**: 学生不存在

## 横向对比

POST /metrics/compare
Auth: parent|teacher
Body:

```json
{
  "studentIds": ["stu_123","stu_456","stu_789"],
  "metrics": ["accuracy","tasks_done","time_spent_min"],
  "window": "last_14d",
  "classId": "cls_001"
}
```

Rules:

- parent：仅返回 selfChild 与“班级匿名分位”（p50/p90），其他学生匿名或不返回
- teacher：仅返回本班学生

### 200
```json
{
  "window": "last_14d",
  "items": [
    {"studentId":"stu_123","accuracy":0.84,"tasks_done":58,"time_spent_min":420,"rank":3},
    {"studentId":"stu_456","accuracy":0.78,"tasks_done":44,"time_spent_min":360,"rank":7}
  ],
  "class_percentiles": {"p50":{"accuracy":0.80},"p90":{"accuracy":0.92}}
}
```