/*
  Warnings:

  - You are about to drop the column `agentId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_agentId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "agentId";
