-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'ACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "FileAccessType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "files" (
    "id" BIGSERIAL NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "hash" TEXT,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "status" "FileStatus" NOT NULL,
    "access_type" "FileAccessType" NOT NULL,
    "uploader_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_usages" (
    "id" BIGSERIAL NOT NULL,
    "file_id" BIGINT NOT NULL,
    "usage_type" TEXT NOT NULL,
    "usage_id" BIGINT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "files_key_key" ON "files"("key");

-- CreateIndex
CREATE INDEX "files_key_idx" ON "files"("key");

-- CreateIndex
CREATE INDEX "files_path_idx" ON "files"("path");

-- CreateIndex
CREATE INDEX "files_uploader_id_idx" ON "files"("uploader_id");

-- CreateIndex
CREATE INDEX "files_status_idx" ON "files"("status");

-- CreateIndex
CREATE INDEX "file_usages_usage_type_usage_id_idx" ON "file_usages"("usage_type", "usage_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_usages_usage_type_usage_id_file_id_key" ON "file_usages"("usage_type", "usage_id", "file_id");

-- AddForeignKey
ALTER TABLE "file_usages" ADD CONSTRAINT "file_usages_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
