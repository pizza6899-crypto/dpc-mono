/*
  Warnings:

  - The primary key for the `activity_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `auth_audit_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `integration_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `system_error_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `unified_logs` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `id` on the `activity_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `auth_audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `integration_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `system_error_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGINT NOT NULL,
ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id", "created_at");

-- AlterTable
ALTER TABLE "auth_audit_logs" DROP CONSTRAINT "auth_audit_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGINT NOT NULL,
ADD CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id", "created_at");

-- AlterTable
ALTER TABLE "integration_logs" DROP CONSTRAINT "integration_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGINT NOT NULL,
ADD CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id", "created_at");

-- AlterTable
ALTER TABLE "system_error_logs" DROP CONSTRAINT "system_error_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGINT NOT NULL,
ADD CONSTRAINT "system_error_logs_pkey" PRIMARY KEY ("id", "created_at");

-- DropTable
DROP TABLE "unified_logs";
