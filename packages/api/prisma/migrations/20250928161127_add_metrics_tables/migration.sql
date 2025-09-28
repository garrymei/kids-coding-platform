-- CreateTable
CREATE TABLE "public"."LearnEvent" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "levelId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "timeMs" INTEGER,
    "ts" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "LearnEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyStat" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "studentId" UUID NOT NULL,
    "studyMinutes" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "passes" INTEGER NOT NULL DEFAULT 0,
    "levelsCompleted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PackageProgress" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "pkgId" TEXT NOT NULL,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearnEvent_studentId_ts_idx" ON "public"."LearnEvent"("studentId", "ts");

-- CreateIndex
CREATE INDEX "LearnEvent_levelId_passed_idx" ON "public"."LearnEvent"("levelId", "passed");

-- CreateIndex
CREATE INDEX "DailyStat_date_idx" ON "public"."DailyStat"("date");

-- CreateIndex
CREATE INDEX "DailyStat_studentId_idx" ON "public"."DailyStat"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStat_studentId_date_key" ON "public"."DailyStat"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PackageProgress_studentId_pkgId_key" ON "public"."PackageProgress"("studentId", "pkgId");

-- AddForeignKey
ALTER TABLE "public"."LearnEvent" ADD CONSTRAINT "LearnEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyStat" ADD CONSTRAINT "DailyStat_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PackageProgress" ADD CONSTRAINT "PackageProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
