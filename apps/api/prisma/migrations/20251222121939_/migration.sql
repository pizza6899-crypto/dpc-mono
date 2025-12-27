-- CreateTable
CREATE TABLE "public"."AffiliateLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "campaignName" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Referral" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "subUserId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "deviceFingerprint" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_code_key" ON "public"."AffiliateLink"("code");

-- CreateIndex
CREATE INDEX "AffiliateLink_userId_idx" ON "public"."AffiliateLink"("userId");

-- CreateIndex
CREATE INDEX "AffiliateLink_userId_isActive_idx" ON "public"."AffiliateLink"("userId", "isActive");

-- CreateIndex
CREATE INDEX "AffiliateLink_code_idx" ON "public"."AffiliateLink"("code");

-- CreateIndex
CREATE INDEX "Referral_affiliateId_idx" ON "public"."Referral"("affiliateId");

-- CreateIndex
CREATE INDEX "Referral_linkId_idx" ON "public"."Referral"("linkId");

-- CreateIndex
CREATE INDEX "Referral_subUserId_idx" ON "public"."Referral"("subUserId");

-- CreateIndex
CREATE INDEX "Referral_affiliateId_linkId_idx" ON "public"."Referral"("affiliateId", "linkId");

-- CreateIndex
CREATE INDEX "Referral_ipAddress_deviceFingerprint_idx" ON "public"."Referral"("ipAddress", "deviceFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_affiliateId_subUserId_key" ON "public"."Referral"("affiliateId", "subUserId");

-- AddForeignKey
ALTER TABLE "public"."AffiliateLink" ADD CONSTRAINT "AffiliateLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "public"."AffiliateLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_subUserId_fkey" FOREIGN KEY ("subUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
