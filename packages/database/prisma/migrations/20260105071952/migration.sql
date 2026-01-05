/*
  Warnings:

  - You are about to drop the `AffiliateCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Referral` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AffiliateCode" DROP CONSTRAINT "AffiliateCode_userId_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_codeId_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_subUserId_fkey";

-- DropTable
DROP TABLE "AffiliateCode";

-- DropTable
DROP TABLE "Referral";

-- CreateTable
CREATE TABLE "affiliate_codes" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "code" TEXT NOT NULL,
    "campaign_name" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "affiliate_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "affiliate_id" BIGINT NOT NULL,
    "sub_user_id" BIGINT NOT NULL,
    "ip_address" TEXT,
    "device_fingerprint" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "code_id" BIGINT NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_codes_uid_key" ON "affiliate_codes"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_codes_code_key" ON "affiliate_codes"("code");

-- CreateIndex
CREATE INDEX "affiliate_codes_user_id_idx" ON "affiliate_codes"("user_id");

-- CreateIndex
CREATE INDEX "affiliate_codes_user_id_is_active_idx" ON "affiliate_codes"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "affiliate_codes_code_idx" ON "affiliate_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_uid_key" ON "referrals"("uid");

-- CreateIndex
CREATE INDEX "referrals_affiliate_id_idx" ON "referrals"("affiliate_id");

-- CreateIndex
CREATE INDEX "referrals_code_id_idx" ON "referrals"("code_id");

-- CreateIndex
CREATE INDEX "referrals_sub_user_id_idx" ON "referrals"("sub_user_id");

-- CreateIndex
CREATE INDEX "referrals_affiliate_id_code_id_idx" ON "referrals"("affiliate_id", "code_id");

-- CreateIndex
CREATE INDEX "referrals_ip_address_device_fingerprint_idx" ON "referrals"("ip_address", "device_fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_affiliate_id_sub_user_id_key" ON "referrals"("affiliate_id", "sub_user_id");

-- AddForeignKey
ALTER TABLE "affiliate_codes" ADD CONSTRAINT "affiliate_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "affiliate_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_sub_user_id_fkey" FOREIGN KEY ("sub_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
