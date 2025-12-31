/*
  Warnings:

  - You are about to drop the `DcsApiLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NowPaymentCallbackLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WhitecliffApiLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "DcsApiLog";

-- DropTable
DROP TABLE "NowPaymentCallbackLog";

-- DropTable
DROP TABLE "WhitecliffApiLog";

-- CreateTable
CREATE TABLE "now_payment_callback_logs" (
    "id" BIGSERIAL NOT NULL,
    "request_headers" JSONB,
    "request_body" JSONB NOT NULL,
    "response_status" INTEGER,
    "response_body" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processing_error" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "now_payment_callback_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whitecliff_api_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "action" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "http_method" TEXT,
    "request" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "status_code" INTEGER,
    "success" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whitecliff_api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dcs_api_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "action" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "http_method" TEXT,
    "request" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "status_code" INTEGER,
    "success" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dcs_api_logs_pkey" PRIMARY KEY ("id")
);
