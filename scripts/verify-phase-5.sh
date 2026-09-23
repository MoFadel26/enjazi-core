#!/usr/bin/env bash
# Phase 5 check, in four parts.
#
# 1. The Phase 4 static checks again: the generated client matches
#    openapi.json, then typecheck, lint (no-explicit-any is an error) and
#    build. "Fully typed against the generated client" is this plus the check
#    that nothing outside src/api calls fetch on its own.
# 2. No source file over 200 lines, which is the plan's size limit for a
#    screen, applied to every file so a screen cannot dodge it by moving
#    lines into a helper of the same size.
# 3. The API, started here if nothing is listening on 5180, with
#    Bootstrap:AdminEmail pointing at the admin the admin test signs in as.
#    The setting goes on the command line, not in the environment: an
#    environment variable would also reach the build-time OpenAPI generator,
#    which builds the host without a database and would fail on it
#    (ADR-0007). The bootstrap only promotes an account that already exists,
#    so on the first run the account is registered and the API restarted.
# 4. Playwright drives every screen against the real API, plus the Phase 4
#    auth tests. Needs the local enjazi_core database migrated.
set -euo pipefail
cd "$(dirname "$0")/.."
web=src/Enjazi.Web
admin_email=phase5-admin@example.test
admin_password=phase5-admin-password

echo "-- dependencies"
[ -d "$web/node_modules" ] || (cd "$web" && npm ci)
(cd "$web" && npx playwright install chromium)

echo "-- generated client is current"
regenerated=$(mktemp)
api_pid=""
cleanup() {
  rm -f "$regenerated"
  [ -n "$api_pid" ] && kill "$api_pid" 2>/dev/null || true
}
trap cleanup EXIT
(cd "$web" && npx openapi-typescript ../../openapi.json -o "$regenerated" >/dev/null)
if ! cmp -s "$regenerated" "$web/src/api/schema.d.ts"; then
  echo "FAIL: schema.d.ts is out of date; run 'npm run generate' in $web and commit it"
  diff "$web/src/api/schema.d.ts" "$regenerated" | head -20
  exit 1
fi
echo "ok: schema.d.ts matches openapi.json"

echo "-- typecheck, lint, build"
(cd "$web" && npm run typecheck && npm run lint && npm run build)

echo "-- every request goes through the generated client"
if grep -rn "fetch(" "$web/src" --include='*.ts' --include='*.tsx' | grep -v "$web/src/api/"; then
  echo "FAIL: a direct fetch call outside src/api bypasses the generated types"
  exit 1
fi
echo "ok: no fetch outside src/api"

echo "-- no source file over 200 lines"
long=$(find "$web/src" -name '*.ts' -o -name '*.tsx' | grep -v schema.d.ts | xargs wc -l | awk '$1 > 200 && $2 != "total" {print}')
if [ -n "$long" ]; then
  echo "FAIL: over 200 lines:"
  echo "$long"
  exit 1
fi
echo "ok: longest files:"
find "$web/src" -name '*.ts' -o -name '*.tsx' | grep -v schema.d.ts | xargs wc -l | sort -rn | sed -n 2,4p

echo "-- API with the bootstrap admin"
api_ready() { curl -s -o /dev/null http://127.0.0.1:5180/api/auth/me; }
start_api() {
  dotnet run --project src/Enjazi.Api -- --Bootstrap:AdminEmail="$admin_email" >/dev/null 2>&1 &
  api_pid=$!
  for _ in $(seq 1 90); do
    api_ready && return 0
    sleep 1
  done
  echo "FAIL: the API did not start on 5180"
  exit 1
}
if api_ready; then
  echo "note: reusing the API already on 5180; the admin test needs it started with --Bootstrap:AdminEmail=$admin_email"
else
  start_api
fi
status=$(curl -s -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' \
  -d "{\"email\":\"$admin_email\",\"displayName\":\"Phase Five Admin\",\"password\":\"$admin_password\"}" \
  http://127.0.0.1:5180/api/auth/register)
if [ "$status" = "201" ] && [ -n "$api_pid" ]; then
  echo "registered $admin_email; restarting the API so the bootstrap promotes it"
  kill "$api_pid"
  wait "$api_pid" 2>/dev/null || true
  api_pid=""
  start_api
fi

echo "-- browser tests against the running API"
(cd "$web" && npm run e2e)
echo PASS
