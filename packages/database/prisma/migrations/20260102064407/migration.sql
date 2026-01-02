/*
  Warnings:

  - A unique constraint covering the columns `[uid]` on the table `deposit_details` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `requested_amount` to the `deposit_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uid` to the `deposit_details` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "deposit_details" ADD COLUMN     "admin_note" TEXT,
ADD COLUMN     "device_fingerprint" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "processed_by" BIGINT,
ADD COLUMN     "requested_amount" DECIMAL(32,18) NOT NULL,
ADD COLUMN     "uid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "deposit_details_uid_key" ON "deposit_details"("uid");

-- CreateIndex
CREATE INDEX "deposit_details_processed_by_idx" ON "deposit_details"("processed_by");

-- CreateIndex
CREATE INDEX "deposit_details_ip_address_device_fingerprint_idx" ON "deposit_details"("ip_address", "device_fingerprint");

-- CreateIndex
CREATE INDEX "deposit_details_ip_address_idx" ON "deposit_details"("ip_address");

-- CreateIndex
CREATE INDEX "deposit_details_device_fingerprint_idx" ON "deposit_details"("device_fingerprint");
