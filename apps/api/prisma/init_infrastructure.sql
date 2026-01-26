-- DPC-mono Infrastructure Initialization SQL
-- Description: Prisma schema가 아닌, DB 인프라 레벨에서 관리되어야 하는 익스텐션입니다.
-- Usage: pnpm db:infra (Superuser 권한 필요)

-- [중요] Prisma와의 충돌 방지:
-- 이 파일에 있는 익스텐션들은 Prisma Schema(common.prisma)에 정의되지 않았습니다.
-- 따라서 'prisma migrate dev' 실행 시 Drift(불일치) 경고가 발생할 수 있습니다.
-- 로컬 개발 시에는 'prisma migrate reset'이 제안될 때 초기화하거나, 'prisma db push'를 사용하는 것을 권장합니다.

-- ==========================================
-- 1. Performance & Monitoring Extensions
-- ==========================================

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;


-- ==========================================
-- 2. Maintenance & Partitioning Extensions
-- ==========================================

-- pg_repack: Bloat 제거 도구
CREATE EXTENSION IF NOT EXISTS pg_repack;

-- pg_partman: 파티셔닝 도구 (Schema 격리 설치)
-- public 스키마를 오염시키지 않도록 전용 스키마에 설치합니다.
CREATE SCHEMA IF NOT EXISTS partman;
CREATE EXTENSION IF NOT EXISTS pg_partman WITH SCHEMA partman;


-- ==========================================
-- 3. Job Scheduling Extension (pg_cron)
-- ==========================================

-- pg_cron: 스케줄링 도구
-- postgresql.conf의 cron.database_name 설정과 일치하는 DB에서만 실행 가능합니다.
CREATE EXTENSION IF NOT EXISTS pg_cron;
