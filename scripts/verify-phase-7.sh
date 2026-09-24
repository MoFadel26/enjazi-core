#!/usr/bin/env bash
# Phase 7 check, in two parts.
#
# 1. The design system is the only source of visual values. No hex colour
#    outside src/theme/ and the FullCalendar bridge stylesheet, and no font
#    family or pixel font size in a component. A value a screen needs goes
#    into the theme first. docs/design.md, "Tokens only".
# 2. Everything verify-phase-5.sh checks: generated client current,
#    typecheck, lint, build, no fetch outside src/api, no file over 200
#    lines, and the whole browser suite against the real API. That suite now
#    includes e2e/theme.spec.ts, which puts the account on each scheme in
#    turn and checks every screen paints on that scheme's canvas in Inter
#    without a page error.
set -euo pipefail
cd "$(dirname "$0")/.."
web=src/Enjazi.Web

echo "-- no colour or type value outside the theme"
hex=$(grep -rnE '#[0-9a-fA-F]{3,8}\b' "$web/src" --include='*.ts' --include='*.tsx' --include='*.css' \
  | grep -v "^$web/src/theme/" \
  | grep -v "^$web/src/calendar/mantine-bridge.css" \
  | grep -v "^$web/src/api/schema.d.ts" || true)
if [ -n "$hex" ]; then
  echo "FAIL: hex colour outside src/theme:"
  echo "$hex"
  exit 1
fi
type_values=$(grep -rnE "fontFamily|fontSize: *['\"]?[0-9]+px" "$web/src" --include='*.tsx' | grep -v "^$web/src/theme/" || true)
if [ -n "$type_values" ]; then
  echo "FAIL: font family or pixel font size in a component:"
  echo "$type_values"
  exit 1
fi
echo "ok: every colour and type value comes from src/theme"

echo "-- the Phase 5 checks and the full browser suite"
scripts/verify-phase-5.sh
