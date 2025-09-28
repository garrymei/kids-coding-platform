# 数据模型（ER）

## 实体与关系
- users：系统账户（student/parent/teacher/admin）
- classes：班级（teacher 拥有者）
- class_enrollments：学生入班（pending/active/revoked）
- relationships：学生与家长/老师关系（来源：share_code/search/class_invite）
- consents：同意记录（pending/approved/rejected）
- access_grants：授权令牌（scope、到期、状态）
- metrics_snapshots：指标快照（用于趋势/对比）
- audit_logs：审计日志（所有查看/导出）

## Mermaid ER
```mermaid
erDiagram
  users {
    string id PK
    string role  "student|parent|teacher|admin"
    string nickname
    string school
    string class_name
    boolean discoverable
    datetime created_at
  }

  classes {
    string id PK
    string owner_teacher_id FK
    string name
    string code
    string status
    datetime created_at
  }

  class_enrollments {
    string id PK
    string class_id FK
    string student_id FK
    string status "pending|active|revoked"
    datetime created_at
  }

  relationships {
    string id PK
    string student_id FK
    string party_id FK
    string party_role "parent|teacher"
    string source "share_code|search|class_invite"
    string status "pending|active|revoked|expired"
    datetime created_at
    datetime revoked_at
  }

  consents {
    string id PK
    string student_id FK
    string requester_id FK
    string purpose
    string scope
    string status "pending|approved|rejected"
    datetime created_at
    datetime expires_at
  }

  access_grants {
    string id PK
    string student_id FK
    string grantee_id FK
    string scope
    string status "active|revoked|expired"
    datetime created_at
    datetime expires_at
  }

  metrics_snapshots {
    string id PK
    string student_id FK
    string chapter_id
    date   date
    int    tasks_done
    float  accuracy
    int    time_spent_min
    int    streak_days
    int    xp_gained
  }

  audit_logs {
    string id PK
    string actor_id FK
    string action
    string target_type
    string target_id
    string route
    json   meta
    datetime ts
  }

  users ||--o{ classes : "owns (teacher)"
  classes ||--o{ class_enrollments : has
  users ||--o{ class_enrollments : "enrolled (student)"
  users ||--o{ relationships : "as student"
  users ||--o{ relationships : "as parent/teacher (party)"
  users ||--o{ consents : "as student"
  users ||--o{ consents : "as requester"
  users ||--o{ access_grants : "as student/grantee"
  users ||--o{ metrics_snapshots : "has"
  users ||--o{ audit_logs : "as actor"
```