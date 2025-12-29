/*
  Warnings:

  - You are about to drop the `user_activity_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "user_activity_logs";

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" BIGINT,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id","createdAt")
);

-- CreateIndex
CREATE INDEX "activity_logs_userId_category_createdAt_idx" ON "activity_logs"("userId", "category", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_category_action_createdAt_idx" ON "activity_logs"("category", "action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt" DESC);
