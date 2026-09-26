#!/usr/bin/env bash
# Phase 9 check, in two parts.
#
# 1. One whitelist, kept in two places. The palette ids the frontend offers
#    and the ones the API accepts are read out of the two files that hold
#    them, not repeated here, and compared. A fifth palette added on one side
#    alone fails here instead of failing a PUT in front of a user.
#    docs/design.md, "Colour"; ADR-0013.
# 2. Everything verify-phase-8.sh checks, which ends in the whole browser
#    suite. That suite now includes e2e/colors.spec.ts: every palette on its
#    own canvas in both schemes, an axe-core colour-contrast check on the
#    dashboard, the tasks screen, a room and settings, the picker applying a
#    palette before Save, and a reload that paints the saved palette with no
#    flash of another one.
set -euo pipefail
cd "$(dirname "$0")/.."
web=src/Enjazi.Web
offers=$web/src/theme/palettes
accepts=src/Enjazi.Api/Controllers/SettingsController.cs

echo "-- the frontend and the API offer the same palettes"
# Each side's whitelist is one array literal: the quoted words of `paletteIds`
# in the palettes module, and of the API's `Palettes` array. A literal broken
# over several lines is not read, and is a failure below rather than a pass.
offered=$(grep -rhoE "paletteIds[^=]*= *\[[^]]*\]" "$offers" \
  | grep -oE "'[a-z][a-z0-9-]*'" | tr -d "'" | sort -u || true)
accepted=$(grep -hoE "Palettes[^=]*= *\[[^]]*\]" "$accepts" \
  | grep -oE '"[a-z][a-z0-9-]*"' | tr -d '"' | sort -u || true)

if [ -z "$offered" ] || [ -z "$accepted" ]; then
  echo "FAIL: no palette ids found in $offers or $accepts"
  exit 1
fi
if [ "$offered" != "$accepted" ]; then
  echo "FAIL: the frontend and the API disagree about the palettes"
  echo "  $offers: $(echo "$offered" | tr '\n' ' ')"
  echo "  $accepts: $(echo "$accepted" | tr '\n' ' ')"
  exit 1
fi
echo "ok: $(echo "$offered" | tr '\n' ' ')"

echo "-- the Phase 8 checks and the full browser suite"
scripts/verify-phase-8.sh
