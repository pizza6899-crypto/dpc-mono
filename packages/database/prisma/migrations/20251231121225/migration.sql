-- CreateTable
CREATE TABLE "unified_logs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "user_id" BIGINT,
    "session_id" TEXT,
    "cf_ray" TEXT,
    "country" TEXT,
    "city" TEXT,
    "bot" BOOLEAN,
    "threat" TEXT,
    "is_mobile" BOOLEAN,
    "ip" TEXT,
    "log_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "unified_logs_pkey" PRIMARY KEY ("id")
);
