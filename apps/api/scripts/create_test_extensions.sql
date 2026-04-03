-- create_test_extensions.sql
-- 안전하게 Postgres 확장을 생성합니다. 일부 확장이 없거나 권한이 없으면 NOTICE를 출력하고 계속 진행합니다.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE EXTENSION pg_trgm WITH SCHEMA public;
    RAISE NOTICE 'Created extension: pg_trgm';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping pg_trgm: %', SQLERRM;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
    CREATE EXTENSION unaccent WITH SCHEMA public;
    RAISE NOTICE 'Created extension: unaccent';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping unaccent: %', SQLERRM;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    CREATE EXTENSION pgcrypto WITH SCHEMA public;
    RAISE NOTICE 'Created extension: pgcrypto';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping pgcrypto: %', SQLERRM;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'citext') THEN
    CREATE EXTENSION citext WITH SCHEMA public;
    RAISE NOTICE 'Created extension: citext';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping citext: %', SQLERRM;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist') THEN
    CREATE EXTENSION btree_gist WITH SCHEMA public;
    RAISE NOTICE 'Created extension: btree_gist';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping btree_gist: %', SQLERRM;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'fuzzystrmatch') THEN
    CREATE EXTENSION fuzzystrmatch WITH SCHEMA public;
    RAISE NOTICE 'Created extension: fuzzystrmatch';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping fuzzystrmatch: %', SQLERRM;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    EXECUTE 'CREATE EXTENSION "uuid-ossp" WITH SCHEMA public';
    RAISE NOTICE 'Created extension: uuid-ossp';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping uuid-ossp: %', SQLERRM;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    CREATE EXTENSION vector WITH SCHEMA public;
    RAISE NOTICE 'Created extension: vector';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping vector: %', SQLERRM;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'tsm_system_rows') THEN
    CREATE EXTENSION tsm_system_rows WITH SCHEMA public;
    RAISE NOTICE 'Created extension: tsm_system_rows';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping tsm_system_rows: %', SQLERRM;
END$$;

-- 끝
