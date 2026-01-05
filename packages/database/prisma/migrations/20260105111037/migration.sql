/*
  Warnings:

  - Added the required column `reason_code` to the `admin_adjustment_details` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AdjustmentReasonCode" AS ENUM ('CS_RECOVERY', 'PROMOTION_REWARD', 'SYSTEM_ERROR_FIX', 'MANUAL_DEPOSIT', 'TEST_ACCOUNT', 'OTHER');

-- AlterTable
ALTER TABLE "admin_adjustment_details" DROP COLUMN "reason_code",
ADD COLUMN     "reason_code" "AdjustmentReasonCode" NOT NULL;
