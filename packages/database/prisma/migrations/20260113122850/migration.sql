/*
  Warnings:

  - The `locale` column on the `notification_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `locale` on the `notification_template_translations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "notification_logs" DROP COLUMN "locale",
ADD COLUMN     "locale" "Language";

-- AlterTable
ALTER TABLE "notification_template_translations" DROP COLUMN "locale",
ADD COLUMN     "locale" "Language" NOT NULL;

-- CreateIndex
CREATE INDEX "notification_template_translations_locale_idx" ON "notification_template_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_translations_template_id_locale_key" ON "notification_template_translations"("template_id", "locale");
