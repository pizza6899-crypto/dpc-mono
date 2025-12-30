-- AlterTable
ALTER TABLE "user_sessions" ADD COLUMN     "is_admin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "user_sessions_is_admin_status_idx" ON "user_sessions"("is_admin", "status");
