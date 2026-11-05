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

TEMP_SERVER_PID=""
cleanup() {
    if [ -n "$TEMP_SERVER_PID" ]; then
        kill "$TEMP_SERVER_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

if ! curl -s http://127.0.0.1:8085/api/health >/dev/null 2>&1; then
    echo ">>> Starting temporary local HTTP server (DISABLE_BOT_POLLING=1) on port 8085..."
    DISABLE_BOT_POLLING=1 PORT=8085 python3 backend/server.py >/tmp/dvoe_test_srv.log 2>&1 &
    TEMP_SERVER_PID=$!
    for i in {1..20}; do
        if curl -s http://127.0.0.1:8085/api/health >/dev/null 2>&1; then
            break
        fi
        sleep 0.25
    done
fi

echo ""
echo ">>> [1/4] Running Backend & E2E Integration Test Suite..."
python3 tests/test_dvoe_suite.py

echo ""
echo ">>> [2/4] Running Production Mass Usage & Concurrency Audit..."
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

