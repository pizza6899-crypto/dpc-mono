-- CreateEnum
CREATE TYPE "TierChangeType" AS ENUM ('INITIAL', 'UPGRADE', 'DOWNGRADE', 'MANUAL_UPDATE');

-- CreateTable
CREATE TABLE "tier" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "requirement_usd" DECIMAL(32,18) NOT NULL,
    "level_up_bonus" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "comp_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "benefits" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_translation" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "tier_id" BIGINT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tier_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tier" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "tier_id" BIGINT NOT NULL,
    "cumulative_rolling_usd" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "highest_promoted_priority" INTEGER NOT NULL DEFAULT 0,
    "is_manual_lock" BOOLEAN NOT NULL DEFAULT false,
    "last_promoted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_history" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "from_tier_id" BIGINT,
    "to_tier_id" BIGINT NOT NULL,
    "change_type" "TierChangeType" NOT NULL,
    "reason" TEXT,
    "rolling_amount_snap" DECIMAL(32,18) NOT NULL,
    "bonus_amount" DECIMAL(32,18),
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_by" TEXT,

    CONSTRAINT "tier_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tier_uid_key" ON "tier"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "tier_priority_key" ON "tier"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "tier_code_key" ON "tier"("code");

-- CreateIndex
CREATE INDEX "tier_priority_idx" ON "tier"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "tier_translation_uid_key" ON "tier_translation"("uid");

-- CreateIndex
CREATE INDEX "tier_translation_language_idx" ON "tier_translation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "tier_translation_tier_id_language_key" ON "tier_translation"("tier_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "user_tier_uid_key" ON "user_tier"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "user_tier_user_id_key" ON "user_tier"("user_id");

-- CreateIndex
CREATE INDEX "user_tier_tier_id_idx" ON "user_tier"("tier_id");

-- CreateIndex
CREATE UNIQUE INDEX "tier_history_uid_key" ON "tier_history"("uid");

-- CreateIndex
CREATE INDEX "tier_history_user_id_idx" ON "tier_history"("user_id");

-- CreateIndex
CREATE INDEX "tier_history_changed_at_idx" ON "tier_history"("changed_at");

-- AddForeignKey
ALTER TABLE "tier_translation" ADD CONSTRAINT "tier_translation_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tier" ADD CONSTRAINT "user_tier_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tier" ADD CONSTRAINT "user_tier_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_history" ADD CONSTRAINT "tier_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_history" ADD CONSTRAINT "tier_history_from_tier_id_fkey" FOREIGN KEY ("from_tier_id") REFERENCES "tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_history" ADD CONSTRAINT "tier_history_to_tier_id_fkey" FOREIGN KEY ("to_tier_id") REFERENCES "tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
