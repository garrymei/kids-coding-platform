-- CreateIndex
-- Index for queries filtering by studentId and date range
CREATE INDEX "metrics_snapshots_studentId_date_idx" ON "public"."metrics_snapshots"("studentId", "date");

-- CreateIndex
-- Index for queries filtering by date range (for class overview queries)
CREATE INDEX "metrics_snapshots_date_idx" ON "public"."metrics_snapshots"("date");