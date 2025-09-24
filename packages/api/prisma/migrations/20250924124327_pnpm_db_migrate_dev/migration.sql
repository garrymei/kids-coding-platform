-- CreateEnum
CREATE TYPE "public"."RoleName" AS ENUM ('student', 'parent', 'teacher', 'admin');

-- CreateEnum
CREATE TYPE "public"."ClassStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."EnrollmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."PartyRole" AS ENUM ('PARENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "public"."RelationshipSource" AS ENUM ('SHARE_CODE', 'SEARCH', 'CLASS_INVITE');

-- CreateEnum
CREATE TYPE "public"."RelationshipStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."GrantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."ConsentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."AppealType" AS ENUM ('UNAUTHORIZED_ACCESS', 'EXCESSIVE_DATA_VIEW', 'PRIVACY_VIOLATION', 'PERMISSION_ABUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AppealStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" SERIAL NOT NULL,
    "name" "public"."RoleName" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "nickname" TEXT,
    "school" TEXT,
    "className" TEXT,
    "discoverable" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "roleId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "suspendedAt" TIMESTAMP(3),
    "needsAuditReview" BOOLEAN NOT NULL DEFAULT false,
    "auditReviewRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."classes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerTeacherId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "status" "public"."ClassStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."class_enrollments" (
    "id" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" "public"."EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."relationships" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "partyId" UUID NOT NULL,
    "partyRole" "public"."PartyRole" NOT NULL,
    "source" "public"."RelationshipSource" NOT NULL,
    "status" "public"."RelationshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."access_grants" (
    "id" UUID NOT NULL,
    "granteeId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "scope" TEXT[],
    "status" "public"."GrantStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "relationshipId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consents" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "scope" TEXT[],
    "status" "public"."ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "metadata" JSONB,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."metrics_snapshots" (
    "id" UUID NOT NULL,
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

-- CreateTable
CREATE TABLE "public"."Appeal" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "appealType" "public"."AppealType" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB DEFAULT '{}',
    "requestedAction" TEXT NOT NULL,
    "status" "public"."AppealStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" UUID,
    "reviewReason" TEXT,
    "reviewActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "closedAt" TIMESTAMP(3),
    "closedBy" UUID,
    "closeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "classes_code_key" ON "public"."classes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "class_enrollments_classId_studentId_key" ON "public"."class_enrollments"("classId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "relationships_studentId_partyId_key" ON "public"."relationships"("studentId", "partyId");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_snapshots_studentId_date_chapterId_key" ON "public"."metrics_snapshots"("studentId", "date", "chapterId");

-- CreateIndex
CREATE INDEX "Appeal_studentId_idx" ON "public"."Appeal"("studentId");

-- CreateIndex
CREATE INDEX "Appeal_targetUserId_idx" ON "public"."Appeal"("targetUserId");

-- CreateIndex
CREATE INDEX "Appeal_status_idx" ON "public"."Appeal"("status");

-- CreateIndex
CREATE INDEX "Appeal_appealType_idx" ON "public"."Appeal"("appealType");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_ownerTeacherId_fkey" FOREIGN KEY ("ownerTeacherId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_enrollments" ADD CONSTRAINT "class_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_enrollments" ADD CONSTRAINT "class_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."relationships" ADD CONSTRAINT "relationships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."relationships" ADD CONSTRAINT "relationships_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."access_grants" ADD CONSTRAINT "access_grants_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "public"."relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."access_grants" ADD CONSTRAINT "access_grants_granteeId_fkey" FOREIGN KEY ("granteeId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."access_grants" ADD CONSTRAINT "access_grants_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consents" ADD CONSTRAINT "consents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consents" ADD CONSTRAINT "consents_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."metrics_snapshots" ADD CONSTRAINT "metrics_snapshots_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appeal" ADD CONSTRAINT "Appeal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appeal" ADD CONSTRAINT "Appeal_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appeal" ADD CONSTRAINT "Appeal_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
