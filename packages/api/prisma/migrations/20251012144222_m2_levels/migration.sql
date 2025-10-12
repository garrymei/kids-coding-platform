-- CreateTable
CREATE TABLE "public"."Level" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 0,
    "starter" JSONB,
    "judge" JSONB,
    "metadata" JSONB,
    "pkgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Level_type_idx" ON "public"."Level"("type");

-- CreateIndex
CREATE INDEX "Level_pkgId_idx" ON "public"."Level"("pkgId");
