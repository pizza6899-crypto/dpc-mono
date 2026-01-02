/*
  Warnings:

  - Added the required column `user_id` to the `deposit_details` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "deposit_details" DROP CONSTRAINT "deposit_details_transaction_id_fkey";

-- AlterTable
ALTER TABLE "deposit_details" ADD COLUMN     "user_id" BIGINT NOT NULL,
ALTER COLUMN "transaction_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
