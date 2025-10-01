/*
  Warnings:

  - The values [PENDING,APPROVED,REJECTED,EXPIRED,REVOKED] on the enum `ConsentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Appeal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `appealType` on the `Appeal` table. All the data in the column will be lost.
  - You are about to drop the column `closeReason` on the `Appeal` table. All the data in the column will be lost.
  - You are about to drop the column `closedBy` on the `Appeal` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Appeal` table. All the data in the column will be lost.
  - You are about to drop the column `evidence` on the `Appeal` table. All the data in the column will be lost.
  - You are about to drop the column `requestedAction` on the `Appeal` table. All the data in the column will be lost.
  - You are about to drop the column `reviewActions` on the `Appeal` table. All the data in the column will be lost.
  - You are about to drop the column `reviewReason` on the `Appeal` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `Appeal` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `Appeal` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Appeal` table. All the data in the column will be lost.
  - The `status` column on the `Appeal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `DailyStat` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `LearnEvent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PackageProgress` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `auditReviewRequestedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `suspendedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `access_grants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `class_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `classes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `consents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metrics_snapshots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `relationships` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[anonymousId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reason` to the `Appeal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Appeal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Appeal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('student', 'parent', 'teacher', 'admin');

-- CreateEnum
CREATE TYPE "public"."MemberStatus" AS ENUM ('pending', 'approved', 'rejected', 'removed');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ConsentStatus_new" AS ENUM ('pending', 'approved', 'rejected', 'revoked');
ALTER TABLE "public"."consents" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."ParentLinkRequest" ALTER COLUMN "status" TYPE "public"."ConsentStatus_new" USING ("status"::text::"public"."ConsentStatus_new");
ALTER TYPE "public"."ConsentStatus" RENAME TO "ConsentStatus_old";
ALTER TYPE "public"."ConsentStatus_new" RENAME TO "ConsentStatus";
DROP TYPE "public"."ConsentStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Appeal" DROP CONSTRAINT "Appeal_reviewedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Appeal" DROP CONSTRAINT "Appeal_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Appeal" DROP CONSTRAINT "Appeal_targetUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DailyStat" DROP CONSTRAINT "DailyStat_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LearnEvent" DROP CONSTRAINT "LearnEvent_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PackageProgress" DROP CONSTRAINT "PackageProgress_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."access_grants" DROP CONSTRAINT "access_grants_granteeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."access_grants" DROP CONSTRAINT "access_grants_relationshipId_fkey";

-- DropForeignKey
ALTER TABLE "public"."access_grants" DROP CONSTRAINT "access_grants_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_actorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."class_enrollments" DROP CONSTRAINT "class_enrollments_classId_fkey";

-- DropForeignKey
ALTER TABLE "public"."class_enrollments" DROP CONSTRAINT "class_enrollments_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."classes" DROP CONSTRAINT "classes_ownerTeacherId_fkey";

-- DropForeignKey
ALTER TABLE "public"."consents" DROP CONSTRAINT "consents_requesterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."consents" DROP CONSTRAINT "consents_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."metrics_snapshots" DROP CONSTRAINT "metrics_snapshots_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."relationships" DROP CONSTRAINT "relationships_partyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."relationships" DROP CONSTRAINT "relationships_studentId_fkey";

-- DropIndex
DROP INDEX "public"."Appeal_appealType_idx";

-- DropIndex
DROP INDEX "public"."Appeal_studentId_idx";

-- DropIndex
DROP INDEX "public"."DailyStat_date_idx";

-- DropIndex
DROP INDEX "public"."DailyStat_studentId_idx";

-- DropIndex
DROP INDEX "public"."LearnEvent_levelId_passed_idx";

-- DropIndex
DROP INDEX "public"."LearnEvent_studentId_ts_idx";

-- AlterTable
ALTER TABLE "public"."Appeal" DROP CONSTRAINT "Appeal_pkey",
DROP COLUMN "appealType",
DROP COLUMN "closeReason",
DROP COLUMN "closedBy",
DROP COLUMN "description",
DROP COLUMN "evidence",
DROP COLUMN "requestedAction",
DROP COLUMN "reviewActions",
DROP COLUMN "reviewReason",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedBy",
DROP COLUMN "studentId",
ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "reason" TEXT NOT NULL,
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewerId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "targetUserId" DROP NOT NULL,
ALTER COLUMN "targetUserId" SET DATA TYPE TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."DailyStat" DROP CONSTRAINT "DailyStat_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "studentId" SET DATA TYPE TEXT,
ADD CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."LearnEvent" DROP CONSTRAINT "LearnEvent_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "studentId" SET DATA TYPE TEXT,
ADD CONSTRAINT "LearnEvent_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."PackageProgress" DROP CONSTRAINT "PackageProgress_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "studentId" SET DATA TYPE TEXT,
ADD CONSTRAINT "PackageProgress_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "auditReviewRequestedAt",
DROP COLUMN "roleId",
DROP COLUMN "suspendedAt",
ADD COLUMN     "anonymousId" TEXT,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "role" "public"."Role" NOT NULL,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "discoverable" SET DEFAULT true,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."Role";

-- DropTable
DROP TABLE "public"."Session";

-- DropTable
DROP TABLE "public"."access_grants";

-- DropTable
DROP TABLE "public"."audit_logs";

-- DropTable
DROP TABLE "public"."class_enrollments";

-- DropTable
DROP TABLE "public"."classes";

-- DropTable
DROP TABLE "public"."consents";

-- DropTable
DROP TABLE "public"."metrics_snapshots";

-- DropTable
DROP TABLE "public"."relationships";

-- DropEnum
DROP TYPE "public"."AppealStatus";

-- DropEnum
DROP TYPE "public"."AppealType";

-- DropEnum
DROP TYPE "public"."ClassStatus";

-- DropEnum
DROP TYPE "public"."EnrollmentStatus";

-- DropEnum
DROP TYPE "public"."GrantStatus";

-- DropEnum
DROP TYPE "public"."PartyRole";

-- DropEnum
DROP TYPE "public"."RelationshipSource";

-- DropEnum
DROP TYPE "public"."RelationshipStatus";

-- DropEnum
DROP TYPE "public"."RoleName";

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
    "scope" TEXT[],
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
    "scope" TEXT[],
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
    "ts" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetricsSnapshot" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "chapterId" TEXT,
    "date" DATE NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "ParentLinkRequest_parentId_studentId_status_key" ON "public"."ParentLinkRequest"("parentId", "studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Class_code_key" ON "public"."Class"("code");

-- CreateIndex
CREATE INDEX "Class_teacherId_idx" ON "public"."Class"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassMember_classId_studentId_key" ON "public"."ClassMember"("classId", "studentId");

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
CREATE INDEX "Appeal_status_idx" ON "public"."Appeal"("status");

-- CreateIndex
CREATE INDEX "Appeal_reviewerId_idx" ON "public"."Appeal"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_anonymousId_key" ON "public"."User"("anonymousId");

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
