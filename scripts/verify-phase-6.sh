#!/usr/bin/env bash
# Phase 6 check, in three parts.
#
# 1. The API tests. StreakTests moves a fake clock through consecutive and
#    missed days, which is the only way to prove "a completed day increments
#    the streak and a missed day resets it" without waiting; MessageTests
#    covers the chat endpoints and their membership gate. Docker is needed
#    for Postgres, as in verify-phase-2.sh.
# 2. openapi.json and schema.d.ts are current, since this phase added
#    endpoints (the same checks as verify-phase-3.sh and verify-phase-4.sh),
#    then typecheck, lint and build.
# 3. Two browser tests against the real API: two tabs, two accounts, each
#    sees the other's messages without reloading; and completing a task
#    shows the streak on the dashboard. The API is started here if nothing is
#    listening on 5180; no admin bootstrap is needed for these two.
set -euo pipefail
cd "$(dirname "$0")/.."
web=src/Enjazi.Web

if ! docker info >/dev/null 2>&1; then
  echo "FAIL: Docker is not running; the API tests need it for Postgres"
  exit 1
fi

echo "-- API tests"
dotnet run --project tests/Enjazi.Api.Tests

echo "-- openapi.json is current"
before=$(mktemp)
regenerated=$(mktemp)
api_pid=""
cleanup() {
  rm -f "$before" "$regenerated"
  [ -n "$api_pid" ] && kill "$api_pid" 2>/dev/null || true
}
trap cleanup EXIT
cp openapi.json "$before"
touch src/Enjazi.Api/Program.cs
dotnet build src/Enjazi.Api -v q --nologo >/dev/null
if ! cmp -s "$before" openapi.json; then
  echo "FAIL: openapi.json changed on rebuild; commit the regenerated file"
  exit 1
fi
echo "ok: openapi.json unchanged by a rebuild"

echo "-- generated client is current"
[ -d "$web/node_modules" ] || (cd "$web" && npm ci)
(cd "$web" && npx openapi-typescript ../../openapi.json -o "$regenerated" >/dev/null)
if ! cmp -s "$regenerated" "$web/src/api/schema.d.ts"; then
  echo "FAIL: schema.d.ts is out of date; run 'npm run generate' in $web and commit it"
  exit 1
fi
echo "ok: schema.d.ts matches openapi.json"

echo "-- typecheck, lint, build"
(cd "$web" && npm run typecheck && npm run lint && npm run build)

echo "-- browser tests against the running API"
(cd "$web" && npx playwright install chromium)
if ! curl -s -o /dev/null http://127.0.0.1:5180/api/auth/me; then
  dotnet run --project src/Enjazi.Api >/dev/null 2>&1 &
  api_pid=$!
  for _ in $(seq 1 90); do
    curl -s -o /dev/null http://127.0.0.1:5180/api/auth/me && break
    sleep 1
  done
  if ! curl -s -o /dev/null http://127.0.0.1:5180/api/auth/me; then
    echo "FAIL: the API did not start on 5180"
    exit 1
  fi
fi
(cd "$web" && npx playwright test e2e/chat.spec.ts e2e/streak.spec.ts)
echo PASS
