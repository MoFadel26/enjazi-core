#!/usr/bin/env bash
# Phase 1 check: the migration applies to a clean database, and the database
# itself rejects a task with no owner or an owner that does not exist.
set -euo pipefail
cd "$(dirname "$0")/.."

DB="enjazi_core_verify_$$"
CONN="Host=127.0.0.1;Port=5432;Database=$DB;Username=$USER"

createdb "$DB"
trap 'dropdb "$DB"' EXIT

echo "-- applying migrations to empty database $DB"
dotnet ef database update --project src/Enjazi.Api --connection "$CONN" >/dev/null

expect_rejection() {
  local label="$1" sql="$2" pattern="$3" err
  if err=$(psql -d "$DB" -v ON_ERROR_STOP=1 -qc "$sql" 2>&1); then
    echo "FAIL: $label was accepted"; exit 1
  fi
  if ! /usr/bin/grep -q "$pattern" <<<"$err"; then
    echo "FAIL: $label rejected for the wrong reason:"; echo "$err"; exit 1
  fi
  echo "ok: $label rejected by the database"
}

expect_rejection "task with no owner" \
  "insert into tasks (id, title, priority, created_at, updated_at)
   values (gen_random_uuid(), 'orphan', 1, now(), now())" \
  'null value in column "owner_id"'

expect_rejection "task with a non-existent owner" \
  "insert into tasks (id, owner_id, title, priority, created_at, updated_at)
   values (gen_random_uuid(), gen_random_uuid(), 'ghost', 1, now(), now())" \
  'violates foreign key constraint "fk_tasks_users_owner_id"'

echo "-- tables in $DB"
psql -d "$DB" -Atc "select table_name from information_schema.tables where table_schema='public' order by 1" | tr '\n' ' '; echo
echo PASS
