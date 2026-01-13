-- AlterTable
ALTER TABLE "notification_logs" ADD COLUMN     "locale" TEXT,
ADD COLUMN     "template_event" TEXT,
ADD COLUMN     "template_id" BIGINT,
ALTER COLUMN "title" SET DATA TYPE TEXT,
ALTER COLUMN "action_uri" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "event" TEXT NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_template_translations" (
    "id" BIGSERIAL NOT NULL,
    "template_id" BIGINT NOT NULL,
    "locale" TEXT NOT NULL,
    "title_template" TEXT NOT NULL,
    "body_template" TEXT NOT NULL,
    "action_uri_template" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_template_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_event_channel_key" ON "notification_templates"("event", "channel");

-- CreateIndex
CREATE INDEX "notification_template_translations_locale_idx" ON "notification_template_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_translations_template_id_locale_key" ON "notification_template_translations"("template_id", "locale");

-- CreateIndex
CREATE INDEX "notification_logs_template_id_idx" ON "notification_logs"("template_id");

-- AddForeignKey
ALTER TABLE "notification_template_translations" ADD CONSTRAINT "notification_template_translations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
