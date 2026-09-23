#!/usr/bin/env bash
# Phase 3 check, in two parts.
#
# 1. The integration tests, which cover every endpoint. Same runner and same
#    Docker requirement as verify-phase-2.sh, and the reason it is not
#    "dotnet test" is explained there.
# 2. openapi.json at the repository root is the committed OpenAPI document.
#    It is regenerated on every build of the API, so this rebuilds and checks
#    that the result is identical to the file as committed. A difference
#    means an endpoint changed and the document was not rebuilt and committed
#    with it.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! docker info >/dev/null 2>&1; then
  echo "FAIL: Docker is not running; the tests need it for Postgres"
  exit 1
fi

echo "-- integration tests"
dotnet run --project tests/Enjazi.Api.Tests

echo "-- openapi.json is current"
before=$(mktemp)
cp openapi.json "$before"
trap 'rm -f "$before"' EXIT
touch src/Enjazi.Api/Program.cs
dotnet build src/Enjazi.Api -v q --nologo >/dev/null
if ! cmp -s "$before" openapi.json; then
  echo "FAIL: openapi.json changed on rebuild; commit the regenerated file"
  diff "$before" openapi.json | head -20
  exit 1
fi
echo "ok: openapi.json unchanged by a rebuild"
echo PASS
