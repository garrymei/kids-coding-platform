-- 创建关系管理相关表
-- 迁移版本: 20250103000001
-- 描述: 创建用户关系、授权、同意书、审计日志等核心表

-- 创建用户表扩展字段
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nickname" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "school" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "className" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "discoverable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "needsAuditReview" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "auditReviewRequestedAt" TIMESTAMP(3);

-- 创建班级表
CREATE TABLE IF NOT EXISTS "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerTeacherId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- 创建班级注册表
CREATE TABLE IF NOT EXISTS "ClassEnrollment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- 创建关系表
CREATE TABLE IF NOT EXISTS "Relationship" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "partyRole" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- 创建访问授权表
CREATE TABLE IF NOT EXISTS "AccessGrant" (
    "id" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scope" TEXT[] NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "reason" TEXT,

    CONSTRAINT "AccessGrant_pkey" PRIMARY KEY ("id")
);

-- 创建同意书表
CREATE TABLE IF NOT EXISTS "Consent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scope" TEXT[] NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- 创建审计日志表
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- 创建指标快照表
CREATE TABLE IF NOT EXISTS "MetricsSnapshot" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "chapterId" TEXT,
    "tasksDone" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timeSpentMin" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "xpGained" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- 创建申诉表
CREATE TABLE IF NOT EXISTS "Appeal" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "appealType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "requestedAction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewReason" TEXT,
    "reviewActions" TEXT[],
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "closeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User"("roleId");
CREATE INDEX IF NOT EXISTS "idx_user_discoverable" ON "User"("discoverable");
CREATE INDEX IF NOT EXISTS "idx_user_school" ON "User"("school");

CREATE INDEX IF NOT EXISTS "idx_class_code" ON "Class"("code");
CREATE INDEX IF NOT EXISTS "idx_class_owner" ON "Class"("ownerTeacherId");
CREATE INDEX IF NOT EXISTS "idx_class_status" ON "Class"("status");

CREATE INDEX IF NOT EXISTS "idx_enrollment_class" ON "ClassEnrollment"("classId");
CREATE INDEX IF NOT EXISTS "idx_enrollment_student" ON "ClassEnrollment"("studentId");
CREATE INDEX IF NOT EXISTS "idx_enrollment_status" ON "ClassEnrollment"("status");

CREATE INDEX IF NOT EXISTS "idx_relationship_student" ON "Relationship"("studentId");
CREATE INDEX IF NOT EXISTS "idx_relationship_party" ON "Relationship"("partyId");
CREATE INDEX IF NOT EXISTS "idx_relationship_status" ON "Relationship"("status");

CREATE INDEX IF NOT EXISTS "idx_grant_grantee" ON "AccessGrant"("granteeId");
CREATE INDEX IF NOT EXISTS "idx_grant_student" ON "AccessGrant"("studentId");
CREATE INDEX IF NOT EXISTS "idx_grant_relationship" ON "AccessGrant"("relationshipId");
CREATE INDEX IF NOT EXISTS "idx_grant_status" ON "AccessGrant"("status");
CREATE INDEX IF NOT EXISTS "idx_grant_expires" ON "AccessGrant"("expiresAt");

CREATE INDEX IF NOT EXISTS "idx_consent_student" ON "Consent"("studentId");
CREATE INDEX IF NOT EXISTS "idx_consent_requester" ON "Consent"("requesterId");
CREATE INDEX IF NOT EXISTS "idx_consent_status" ON "Consent"("status");

CREATE INDEX IF NOT EXISTS "idx_audit_actor" ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "idx_audit_action" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "idx_audit_target" ON "AuditLog"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "idx_audit_timestamp" ON "AuditLog"("ts");
CREATE INDEX IF NOT EXISTS "idx_audit_severity" ON "AuditLog"("severity");

CREATE INDEX IF NOT EXISTS "idx_metrics_student" ON "MetricsSnapshot"("studentId");
CREATE INDEX IF NOT EXISTS "idx_metrics_date" ON "MetricsSnapshot"("date");
CREATE INDEX IF NOT EXISTS "idx_metrics_chapter" ON "MetricsSnapshot"("chapterId");

CREATE INDEX IF NOT EXISTS "idx_appeal_student" ON "Appeal"("studentId");
CREATE INDEX IF NOT EXISTS "idx_appeal_target" ON "Appeal"("targetUserId");
CREATE INDEX IF NOT EXISTS "idx_appeal_status" ON "Appeal"("status");
CREATE INDEX IF NOT EXISTS "idx_appeal_type" ON "Appeal"("appealType");

-- 创建唯一约束
CREATE UNIQUE INDEX IF NOT EXISTS "idx_enrollment_unique" ON "ClassEnrollment"("classId", "studentId");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_relationship_unique" ON "Relationship"("studentId", "partyId");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_metrics_student_date" ON "MetricsSnapshot"("studentId", "date");

-- 添加外键约束
ALTER TABLE "Class" ADD CONSTRAINT "Class_ownerTeacherId_fkey" FOREIGN KEY ("ownerTeacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_granteeId_fkey" FOREIGN KEY ("granteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MetricsSnapshot" ADD CONSTRAINT "MetricsSnapshot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
