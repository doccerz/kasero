#!/bin/bash
export PLAYWRIGHT_BASE_URL=http://localhost:3000
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=replace-with-a-strong-password
cd /home/babin/code/kasero/apps/web
npx playwright test e2e/sit-dash.spec.ts --reporter=list
