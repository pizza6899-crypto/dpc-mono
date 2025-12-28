-- CreateEnum
CREATE TYPE "LoginAttemptResult" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "LoginFailureReason" AS ENUM ('INVALID_CREDENTIALS', 'USER_NOT_FOUND', 'ACCOUNT_SUSPENDED', 'ACCOUNT_CLOSED', 'THROTTLE_LIMIT_EXCEEDED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "userId" TEXT,
    "result" "LoginAttemptResult" NOT NULL,
    "failureReason" "LoginFailureReason",
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    "isMobile" BOOLEAN,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginAttempt_uid_key" ON "LoginAttempt"("uid");

-- CreateIndex
CREATE INDEX "LoginAttempt_userId_idx" ON "LoginAttempt"("userId");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_idx" ON "LoginAttempt"("email");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_idx" ON "LoginAttempt"("ipAddress");

-- CreateIndex
CREATE INDEX "LoginAttempt_attemptedAt_idx" ON "LoginAttempt"("attemptedAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_result_idx" ON "LoginAttempt"("result");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_attemptedAt_idx" ON "LoginAttempt"("email", "attemptedAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_attemptedAt_idx" ON "LoginAttempt"("ipAddress", "attemptedAt");

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
