#!/usr/bin/env bash
# Phase 4 check, in three parts.
#
# 1. src/Enjazi.Web/src/api/schema.d.ts is generated from openapi.json and
#    committed. Regenerate and fail on a difference, the same way
#    verify-phase-3.sh checks openapi.json itself.
# 2. Typecheck, lint and build. The lint step has no-explicit-any as an error,
#    which is the plan's "no any in the client".
# 3. Playwright drives the real app against the real API: login,
#    protected-route redirect, logout. The API is started here if nothing is
#    listening on 5180, and needs the local enjazi_core database migrated.
#    Chromium is downloaded on the first run.
set -euo pipefail
cd "$(dirname "$0")/.."
web=src/Enjazi.Web

echo "-- dependencies"
[ -d "$web/node_modules" ] || (cd "$web" && npm ci)
(cd "$web" && npx playwright install chromium)

echo "-- generated client is current"
regenerated=$(mktemp)
trap 'rm -f "$regenerated"' EXIT
(cd "$web" && npx openapi-typescript ../../openapi.json -o "$regenerated" >/dev/null)
if ! cmp -s "$regenerated" "$web/src/api/schema.d.ts"; then
  echo "FAIL: schema.d.ts is out of date; run 'npm run generate' in $web and commit it"
  diff "$web/src/api/schema.d.ts" "$regenerated" | head -20
  exit 1
fi
echo "ok: schema.d.ts matches openapi.json"

echo "-- typecheck, lint, build"
(cd "$web" && npm run typecheck && npm run lint && npm run build)

echo "-- browser tests against the running API"
api_pid=""
if ! curl -s -o /dev/null http://127.0.0.1:5180/api/auth/me; then
  dotnet run --project src/Enjazi.Api >/dev/null 2>&1 &
  api_pid=$!
  trap 'rm -f "$regenerated"; kill "$api_pid" 2>/dev/null || true' EXIT
  for _ in $(seq 1 60); do
    curl -s -o /dev/null http://127.0.0.1:5180/api/auth/me && break
    sleep 1
  done
  if ! curl -s -o /dev/null http://127.0.0.1:5180/api/auth/me; then
    echo "FAIL: the API did not start on 5180"
    exit 1
  fi
fi
(cd "$web" && npm run e2e)
echo PASS
