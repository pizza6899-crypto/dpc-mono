#!/usr/bin/env bash
set -euo pipefail

# setup_test_db.sh
# Usage:
#   TEST_DATABASE_URL=<db_url> ./setup_test_db.sh [--schema NAME] [--skip-push] [--dry-run] [--force]
#   or
#   ./setup_test_db.sh --use-dotenv
#
# 동작:
# 1) `apps/api/.env.test`에서 DATABASE_URL을 읽거나, env `TEST_DATABASE_URL`을 사용합니다.
# 2) `create_test_extensions.sql`을 실행해 필요한 확장을 생성합니다.
# 3) 지정한 스키마가 없으면 생성합니다.
# 4) `prisma db push`로 스키마를 적용합니다(기본). --skip-push로 건너뜀

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$SCRIPT_DIR/create_test_extensions.sql"

DRY_RUN=false
SKIP_PUSH=false
FORCE=false
USE_DOTENV=false
SCHEMA_OVERRIDE=""

redact_url() {
  echo "$1" | sed -E 's#(://)[^/@]+@#\1***@#'
}

is_local_host() {
  case "$1" in
    localhost|127.*|::1|host.docker.internal) return 0 ;;
    10.*|192.168.*) return 0 ;;
    172.1[6-9].*|172.2[0-9].*|172.3[0-1].*) return 0 ;;
    *) return 1 ;;
  esac
}

usage() {
  cat <<EOF
Usage: $0 [--use-dotenv] [--schema NAME] [--skip-push] [--dry-run] [--force]

Options:
  --use-dotenv     Read DATABASE_URL from apps/api/.env.test
  --schema NAME    Override schema name to use
  --skip-push      Skip 'prisma db push'
  --dry-run        Show actions but do not execute
  --force          Force even if DB host looks non-local
  -h, --help       Show this help
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --use-dotenv) USE_DOTENV=true; shift ;;
    --skip-push) SKIP_PUSH=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --force) FORCE=true; shift ;;
    --schema)
      shift
      if [ "$#" -eq 0 ]; then
        echo "ERROR: --schema requires a value" >&2
        usage
        exit 1
      fi
      SCHEMA_OVERRIDE="$1"
      shift
      ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [ "$USE_DOTENV" = true ]; then
  if [ -f "$API_DIR/.env.test" ]; then
    DB_URL_RAW="$(grep -E '^DATABASE_URL=' "$API_DIR/.env.test" | sed 's/DATABASE_URL=//; s/^"//; s/"$//')"
  else
    echo "ERROR: $API_DIR/.env.test not found" >&2
    exit 1
  fi
elif [ -n "${TEST_DATABASE_URL:-}" ]; then
  DB_URL_RAW="$TEST_DATABASE_URL"
elif [ -n "${DATABASE_URL:-}" ]; then
  DB_URL_RAW="$DATABASE_URL"
else
  if [ -f "$API_DIR/.env.test" ]; then
    DB_URL_RAW="$(grep -E '^DATABASE_URL=' "$API_DIR/.env.test" | sed 's/DATABASE_URL=//; s/^"//; s/"$//')"
  else
    echo "ERROR: No DATABASE_URL found. Provide TEST_DATABASE_URL or add apps/api/.env.test" >&2
    exit 1
  fi
fi

# if schema override provided, strip existing schema param and append new one
if [ -n "$SCHEMA_OVERRIDE" ]; then
  # remove any existing schema=... parameter
  DB_URL_BASE="$(echo "$DB_URL_RAW" | sed -E 's/([&?])schema=[^&]*//g')"
  if [[ "$DB_URL_BASE" == *"?"* ]]; then
    DB_URL="${DB_URL_BASE}&schema=${SCHEMA_OVERRIDE}"
  else
    DB_URL="${DB_URL_BASE}?schema=${SCHEMA_OVERRIDE}"
  fi
  SCHEMA="$SCHEMA_OVERRIDE"
else
  if [[ "$DB_URL_RAW" =~ \?schema=([^&]+) ]]; then
    SCHEMA="${BASH_REMATCH[1]}"
    DB_URL="$DB_URL_RAW"
  else
    SCHEMA="${SCHEMA:-test_schema}"
    if [[ "$DB_URL_RAW" == *"?"* ]]; then
      DB_URL="$DB_URL_RAW&schema=$SCHEMA"
    else
      DB_URL="$DB_URL_RAW?schema=$SCHEMA"
    fi
  fi
fi

export DATABASE_URL="$DB_URL"

echo "[setup_test_db] DATABASE_URL=$(redact_url "$DATABASE_URL")"
echo "[setup_test_db] SCHEMA=${SCHEMA}"

if [ ! -f "$SQL_FILE" ]; then
  echo "ERROR: SQL file not found: $SQL_FILE" >&2
  exit 1
fi

# safety: ensure pnpm exists
if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm not found in PATH" >&2
  exit 1
fi

if ! pnpm -C "$API_DIR" exec -- prisma -v >/dev/null 2>&1; then
  echo "ERROR: prisma unavailable via pnpm in $API_DIR" >&2
  exit 1
fi

# parse host and port for readiness and safety checks
TMP_URL="${DB_URL_RAW#*://}"
if [[ "$TMP_URL" == *"@"* ]]; then
  TMP_URL="${TMP_URL#*@}"
fi
HOST="${TMP_URL%%[:/?]*}"
if [ -z "$HOST" ]; then
  HOST="localhost"
fi

PORT_PART="${TMP_URL#*:}"
if [ "$PORT_PART" = "$TMP_URL" ]; then
  PORT=5432
else
  PORT="${PORT_PART%%[/?]*}"
  if [ -z "$PORT" ]; then
    PORT=5432
  fi
fi

# host safety: require --force if DB host looks non-local
if ! is_local_host "$HOST" && [ "$FORCE" != true ]; then
  echo "ERROR: DB host '$HOST' looks non-local. Use --force to override." >&2
  exit 1
fi

if [ "$DRY_RUN" = true ]; then
  echo "[setup_test_db] DRY RUN - no commands will be executed"
  echo "Would run: pnpm -C $API_DIR exec -- prisma db execute --file $SQL_FILE"
  echo "Would ensure schema: $SCHEMA"
  if [ "$SKIP_PUSH" = true ]; then
    echo "Skipping prisma db push (flag set)"
  else
    echo "Would run: pnpm -C $API_DIR exec -- prisma db push --accept-data-loss"
  fi
  exit 0
fi

# wait for DB readiness if pg_isready available
if command -v pg_isready >/dev/null 2>&1; then
  echo "[setup_test_db] Waiting for DB to be ready at $HOST:$PORT..."
  TRY=0
  until pg_isready -h "$HOST" -p "$PORT" >/dev/null 2>&1 || [ $TRY -ge 30 ]; do
    TRY=$((TRY+1))
    echo "[setup_test_db] waiting for database... ($TRY/30)"
    sleep 1
  done
  if [ $TRY -ge 30 ]; then
    echo "ERROR: database not ready at $HOST:$PORT" >&2
    exit 1
  fi
else
  echo "[setup_test_db] pg_isready not found; skipping readiness check"
fi

echo "[setup_test_db] Creating extensions..."
if ! pnpm -C "$API_DIR" exec -- prisma db execute --file "$SQL_FILE"; then
  echo "[setup_test_db] Warning: extension script returned non-zero (continuing)" >&2
fi

echo "[setup_test_db] Ensuring schema exists: $SCHEMA"
if ! pnpm -C "$API_DIR" exec -- prisma db execute --stdin <<SQL
CREATE SCHEMA IF NOT EXISTS ${SCHEMA};
SQL
then
  echo "[setup_test_db] Warning: failed to create schema (continuing)" >&2
fi

if [ "$SKIP_PUSH" = true ]; then
  echo "[setup_test_db] Skipping 'prisma db push' (flag set)"
else
  echo "[setup_test_db] Applying Prisma schema (db push)"
  pnpm -C "$API_DIR" exec -- prisma db push --accept-data-loss
fi

echo "[setup_test_db] Done."
