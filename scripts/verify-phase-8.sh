#!/usr/bin/env bash
# Phase 8 check, in two parts.
#
# 1. Motion comes from the theme. No millisecond literal and no numeric
#    duration or delay outside src/theme/, the same rule Phase 7 applies to
#    colours. docs/design.md, "Motion".
# 2. Everything verify-phase-7.sh checks, which ends in the whole browser
#    suite. That suite now includes the Phase 8 tests: optimistic tick,
#    rename and delete with their rollbacks, shortcuts and the palette,
#    groups, empty-state action, skeleton, points moment, reduced motion.
set -euo pipefail
cd "$(dirname "$0")/.."
web=src/Enjazi.Web

echo "-- no duration outside the theme"
durations=$(grep -rnE "[0-9]ms\b|(duration|Duration|delay|Delay)['\"]?[=:] *\{? *[0-9]" "$web/src" \
  --include='*.ts' --include='*.tsx' --include='*.css' \
  | grep -v "^$web/src/theme/" \
  | grep -v "^$web/src/api/schema.d.ts" || true)
if [ -n "$durations" ]; then
  echo "FAIL: duration outside src/theme:"
  echo "$durations"
  exit 1
fi
echo "ok: every duration comes from src/theme/motion.ts"

echo "-- the Phase 7 checks and the full browser suite"
scripts/verify-phase-7.sh
