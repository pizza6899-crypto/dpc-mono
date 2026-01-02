/*
  Warnings:

  - You are about to drop the column `account_holder` on the `deposit_details` table. All the data in the column will be lost.
  - You are about to drop the column `account_number` on the `deposit_details` table. All the data in the column will be lost.
  - You are about to drop the column `bank_name` on the `deposit_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "deposit_details" DROP COLUMN "account_holder",
DROP COLUMN "account_number",
DROP COLUMN "bank_name",
ADD COLUMN     "crypto_config_id" BIGINT;

-- CreateIndex
CREATE INDEX "deposit_details_bank_config_id_idx" ON "deposit_details"("bank_config_id");

-- CreateIndex
CREATE INDEX "deposit_details_crypto_config_id_idx" ON "deposit_details"("crypto_config_id");

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_crypto_config_id_fkey" FOREIGN KEY ("crypto_config_id") REFERENCES "crypto_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
