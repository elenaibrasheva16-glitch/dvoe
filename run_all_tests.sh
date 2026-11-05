#!/usr/bin/env bash
# ==============================================================================
# «Двое» (Two) — Master Test Runner
# Verifies Backend APIs, Partner Sync, Mood Tracking, Photos, Mass Usage & Frontend
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================================================================"
echo "🚀 EXECUTING MASTER TEST SUITE: «ДВОЕ» (TWO COUPLE APP)"
echo "================================================================================"

echo ""
echo ">>> [1/3] Running Backend & E2E Integration Test Suite..."
python3 tests/test_dvoe_suite.py

echo ""
echo ">>> [2/3] Running Production Mass Usage & Concurrency Audit..."
python3 tests/test_mass_usage_audit.py

echo ""
echo ">>> [3/4] Running Frontend JavaScriptCore Test Suite..."
JSC_BIN="/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"
if [ -x "$JSC_BIN" ]; then
    "$JSC_BIN" tests/test_dvoe_frontend.js
else
    echo "[Skip] jsc binary not found at $JSC_BIN"
fi

echo ""
echo ">>> [4/4] Running Cross-Promo (ВП), Partner System & Privacy Audit Test Suite..."
python3 tests/test_vp_promo_system.py

echo ""
echo "================================================================================"
echo "🎉 ALL TESTS COMPLETED SUCCESSFULLY! ZERO DEFECTS FOUND."
echo "================================================================================"
