-- 更新数据模型迁移脚本

-- 添加用户表新字段
ALTER TABLE "User" ADD COLUMN "nickname" TEXT;
ALTER TABLE "User" ADD COLUMN "school" TEXT;
ALTER TABLE "User" ADD COLUMN "className" TEXT;
ALTER TABLE "User" ADD COLUMN "discoverable" BOOLEAN NOT NULL DEFAULT false;

-- 更新班级表
ALTER TABLE "classes" RENAME COLUMN "inviteCode" TO "code";
ALTER TABLE "classes" ADD COLUMN "status" "ClassStatus" NOT NULL DEFAULT 'ACTIVE';

-- 更新关系表
ALTER TABLE "relationships" ADD COLUMN "revokedAt" TIMESTAMP(3);
ALTER TABLE "relationships" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- 更新访问授权表
ALTER TABLE "access_grants" DROP COLUMN "resourceType";
ALTER TABLE "access_grants" DROP COLUMN "resourceId";
ALTER TABLE "access_grants" ADD COLUMN "studentId" UUID NOT NULL;
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 更新同意书表
ALTER TABLE "consents" ADD COLUMN "scope" TEXT[];

-- 更新审计日志表
ALTER TABLE "audit_logs" RENAME COLUMN "createdAt" TO "ts";

-- 创建指标快照表
CREATE TABLE "metrics_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "chapterId" UUID,
    "tasksDone" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timeSpentMin" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "xpGained" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_snapshots_pkey" PRIMARY KEY ("id")
);

-- 添加外键约束
ALTER TABLE "metrics_snapshots" ADD CONSTRAINT "metrics_snapshots_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 创建唯一索引
CREATE UNIQUE INDEX "metrics_snapshots_studentId_date_chapterId_key" ON "metrics_snapshots"("studentId", "date", "chapterId");

-- 创建枚举类型
CREATE TYPE "ClassStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- 更新现有枚举
ALTER TYPE "RelationshipSource" RENAME VALUE 'INVITE_CODE' TO 'SHARE_CODE';
ALTER TYPE "RelationshipSource" RENAME VALUE 'CLASS_LINK' TO 'CLASS_INVITE';
ALTER TYPE "RelationshipSource" ADD VALUE 'SEARCH';

ALTER TYPE "RelationshipStatus" ADD VALUE 'PENDING';
ALTER TYPE "RelationshipStatus" ADD VALUE 'EXPIRED';

-- 创建索引
CREATE INDEX "idx_users_discoverable" ON "User"("discoverable");
CREATE INDEX "idx_users_nickname" ON "User"("nickname");
CREATE INDEX "idx_users_school" ON "User"("school");
CREATE INDEX "idx_users_className" ON "User"("className");
CREATE INDEX "idx_access_grants_studentId" ON "access_grants"("studentId");
CREATE INDEX "idx_metrics_snapshots_studentId" ON "metrics_snapshots"("studentId");
CREATE INDEX "idx_metrics_snapshots_date" ON "metrics_snapshots"("date");
CREATE INDEX "idx_metrics_snapshots_chapterId" ON "metrics_snapshots"("chapterId");
