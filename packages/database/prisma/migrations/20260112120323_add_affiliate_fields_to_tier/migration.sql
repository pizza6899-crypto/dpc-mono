-- AlterTable
ALTER TABLE "tier" ADD COLUMN     "affiliate_commission_rate" DECIMAL(8,4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user_tier" ADD COLUMN     "affiliate_custom_rate" DECIMAL(8,4),
ADD COLUMN     "affiliate_monthly_wager_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
ADD COLUMN     "is_affiliate_custom_rate" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "user_tier_affiliate_monthly_wager_amount_idx" ON "user_tier"("affiliate_monthly_wager_amount");
