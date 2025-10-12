-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('student', 'parent', 'teacher', 'admin');

-- CreateEnum
CREATE TYPE "public"."ConsentStatus" AS ENUM ('pending', 'approved', 'rejected', 'revoked');

-- CreateEnum
CREATE TYPE "public"."MemberStatus" AS ENUM ('pending', 'approved', 'rejected', 'removed');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "public"."Role" NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "nickname" TEXT,
    "school" TEXT,
    "className" TEXT,
    "avatar" TEXT,
    "discoverable" BOOLEAN NOT NULL DEFAULT true,
    "anonymousId" TEXT,
    "status" TEXT,
    "needsAuditReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ParentLinkRequest" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "public"."ConsentStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "ParentLinkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Class" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "codeTTL" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClassMember" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "public"."MemberStatus" NOT NULL,
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "ClassMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LearnEvent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "timeMs" INTEGER,
    "ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyStat" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "studyMinutes" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "passes" INTEGER NOT NULL DEFAULT 0,
    "levelsCompleted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PackageProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "pkgId" TEXT NOT NULL,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Relationship" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "partyRole" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Consent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccessGrant" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "relationshipId" TEXT,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,

    CONSTRAINT "AccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "route" TEXT,
    "meta" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" TEXT,
    "ts" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetricsSnapshot" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "chapterId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "tasksDone" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION,
    "timeSpentMin" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "xpGained" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClassEnrollment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Appeal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewerId" TEXT,
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "decidedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_anonymousId_key" ON "public"."User"("anonymousId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentLinkRequest_parentId_studentId_status_key" ON "public"."ParentLinkRequest"("parentId", "studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Class_code_key" ON "public"."Class"("code");

-- CreateIndex
CREATE INDEX "Class_teacherId_idx" ON "public"."Class"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassMember_classId_studentId_key" ON "public"."ClassMember"("classId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStat_studentId_date_key" ON "public"."DailyStat"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PackageProgress_studentId_pkgId_key" ON "public"."PackageProgress"("studentId", "pkgId");

-- CreateIndex
CREATE INDEX "Relationship_studentId_idx" ON "public"."Relationship"("studentId");

-- CreateIndex
CREATE INDEX "Relationship_partyId_idx" ON "public"."Relationship"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_studentId_partyId_key" ON "public"."Relationship"("studentId", "partyId");

-- CreateIndex
CREATE INDEX "Consent_studentId_idx" ON "public"."Consent"("studentId");

-- CreateIndex
CREATE INDEX "Consent_requesterId_idx" ON "public"."Consent"("requesterId");

-- CreateIndex
CREATE INDEX "AccessGrant_studentId_idx" ON "public"."AccessGrant"("studentId");

-- CreateIndex
CREATE INDEX "AccessGrant_granteeId_idx" ON "public"."AccessGrant"("granteeId");

-- CreateIndex
CREATE INDEX "AccessGrant_relationshipId_idx" ON "public"."AccessGrant"("relationshipId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "public"."AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "public"."AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_ts_idx" ON "public"."AuditLog"("ts");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "MetricsSnapshot_studentId_idx" ON "public"."MetricsSnapshot"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricsSnapshot_studentId_date_chapterId_key" ON "public"."MetricsSnapshot"("studentId", "date", "chapterId");

-- CreateIndex
CREATE INDEX "ClassEnrollment_classId_idx" ON "public"."ClassEnrollment"("classId");

-- CreateIndex
CREATE INDEX "ClassEnrollment_studentId_idx" ON "public"."ClassEnrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassEnrollment_classId_studentId_key" ON "public"."ClassEnrollment"("classId", "studentId");

-- CreateIndex
CREATE INDEX "Appeal_userId_idx" ON "public"."Appeal"("userId");

-- CreateIndex
CREATE INDEX "Appeal_targetUserId_idx" ON "public"."Appeal"("targetUserId");

-- CreateIndex
CREATE INDEX "Appeal_status_idx" ON "public"."Appeal"("status");

-- CreateIndex
CREATE INDEX "Appeal_reviewerId_idx" ON "public"."Appeal"("reviewerId");

-- AddForeignKey
ALTER TABLE "public"."ParentLinkRequest" ADD CONSTRAINT "ParentLinkRequest_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParentLinkRequest" ADD CONSTRAINT "ParentLinkRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Class" ADD CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassMember" ADD CONSTRAINT "ClassMember_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassMember" ADD CONSTRAINT "ClassMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearnEvent" ADD CONSTRAINT "LearnEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyStat" ADD CONSTRAINT "DailyStat_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PackageProgress" ADD CONSTRAINT "PackageProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Relationship" ADD CONSTRAINT "Relationship_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Relationship" ADD CONSTRAINT "Relationship_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Consent" ADD CONSTRAINT "Consent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Consent" ADD CONSTRAINT "Consent_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccessGrant" ADD CONSTRAINT "AccessGrant_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccessGrant" ADD CONSTRAINT "AccessGrant_granteeId_fkey" FOREIGN KEY ("granteeId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccessGrant" ADD CONSTRAINT "AccessGrant_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "public"."Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetricsSnapshot" ADD CONSTRAINT "MetricsSnapshot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
