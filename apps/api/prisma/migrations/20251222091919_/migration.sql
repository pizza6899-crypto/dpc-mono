/*
  Warnings:

  - The values [SETTLEMENT] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `AgentCommissionLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SettlementDetail` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."TransactionType_new" AS ENUM ('DEPOSIT', 'WITHDRAW', 'GAME', 'BONUS', 'COMP_CLAIM');
ALTER TABLE "public"."Transaction" ALTER COLUMN "type" TYPE "public"."TransactionType_new" USING ("type"::text::"public"."TransactionType_new");
ALTER TYPE "public"."TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "public"."TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."AgentCommissionLog" DROP CONSTRAINT "AgentCommissionLog_agentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AgentCommissionLog" DROP CONSTRAINT "AgentCommissionLog_gameRoundId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AgentCommissionLog" DROP CONSTRAINT "AgentCommissionLog_memberId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AgentCommissionLog" DROP CONSTRAINT "AgentCommissionLog_settlementDetailId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AgentCommissionLog" DROP CONSTRAINT "AgentCommissionLog_vipHistoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SettlementDetail" DROP CONSTRAINT "SettlementDetail_transactionId_fkey";

-- DropTable
DROP TABLE "public"."AgentCommissionLog";

-- DropTable
DROP TABLE "public"."SettlementDetail";

-- DropEnum
DROP TYPE "public"."CommissionSourceType";
