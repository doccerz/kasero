#!/bin/bash

# Run all tests for Kasero project
# This script runs: API tests, Web tests, and Playwright e2e tests

set -e

echo "========================================="
echo "Running All Kasero Tests"
echo "========================================="
echo ""

# Step 1: API Tests
echo "Step 1: Running API Tests (Jest)..."
echo "-----------------------------------------"
cd /home/babin/code/kasero
npm run test:api 2>&1 | tee /tmp/api-test-output.txt
API_EXIT_CODE=${PIPESTATUS[0]}

if [ $API_EXIT_CODE -eq 0 ]; then
    echo "✓ API Tests PASSED"
else
    echo "✗ API Tests FAILED"
    echo "First error from API tests:"
    grep -A 10 "FAIL\|Error:" /tmp/api-test-output.txt | head -20
    exit 1
fi

echo ""

# Step 2: Web Tests
echo "Step 2: Running Web Tests (Jest)..."
echo "-----------------------------------------"
npm run test:web 2>&1 | tee /tmp/web-test-output.txt
WEB_EXIT_CODE=${PIPESTATUS[0]}

if [ $WEB_EXIT_CODE -eq 0 ]; then
    echo "✓ Web Tests PASSED"
else
    echo "✗ Web Tests FAILED"
    echo "First error from Web tests:"
    grep -A 10 "FAIL\|Error:" /tmp/web-test-output.txt | head -20
    exit 1
fi

echo ""

# Step 3: Playwright e2e Tests
echo "Step 3: Running Playwright e2e Tests..."
echo "-----------------------------------------"
cd apps/web
npm run test:e2e 2>&1 | tee /tmp/e2e-test-output.txt
E2E_EXIT_CODE=${PIPESTATUS[0]}

if [ $E2E_EXIT_CODE -eq 0 ]; then
    echo "✓ Playwright e2e Tests PASSED"
else
    echo "✗ Playwright e2e Tests FAILED"
    echo "First error from Playwright tests:"
    grep -A 10 "FAIL\|Error:\|Error:" /tmp/e2e-test-output.txt | head -30
    exit 1
fi

echo ""
echo "========================================="
echo "ALL TESTS PASSED!"
echo "========================================="
