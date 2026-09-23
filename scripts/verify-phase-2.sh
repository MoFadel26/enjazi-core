#!/usr/bin/env bash
# Phase 2 check: the integration tests. The one the plan names is
# TaskOwnershipTests.User_a_gets_404_fetching_user_bs_task.
#
# The tests bring up their own Postgres container, so Docker has to be running
# and the local enjazi_core database is left alone.
#
# Not "dotnet test": the .NET 10 SDK dropped VSTest, and the runner that
# replaced it reports "Zero tests ran" for a xunit.v3 project. That reproduces
# on an empty project, so it is the toolchain rather than this repository. A
# xunit.v3 project is its own test host, so running it directly is the same
# test run without that layer.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! docker info >/dev/null 2>&1; then
  echo "FAIL: Docker is not running; the tests need it for Postgres"
  exit 1
fi

dotnet run --project tests/Enjazi.Api.Tests
echo PASS
