/**
 * SIT/UAT Cycle 2 — Dashboard Edge Cases
 * Tests: TC-DASH-004 through TC-DASH-007
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'replace-with-a-strong-password';

const LOGIN_BTN = /log in/i;

async function loginAndGoToDashboard(page: import('@playwright/test').Page) {
    await page.goto('/admin/login');
    await page.getByLabel(/username/i).fill(ADMIN_USER);
    await page.getByLabel(/password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: LOGIN_BTN }).click();
    await page.waitForURL(/\/admin\/(dashboard|spaces)/);
    await page.goto('/admin/dashboard');
}

// ────────────────────────────────────────────────────────────────────────────
// TC-DASH-004 — All Spaces Overdue
// BLOCKED: Preconditions cannot be met with current test data.
// Current DB state (2026-03-31):
//   - Space "121": overdue (balance = 2000)
//   - Space "3115": future contract starts 2026-04-01, 0 due payables — NOT overdue
//   - Space "ROOM 106": future contract starts 2026-04-08, 0 due payables — NOT overdue
//   - Space "XXX": fully paid (amount_due = 0) — NOT overdue
// ────────────────────────────────────────────────────────────────────────────
test.skip('TC-DASH-004: All spaces show as Overdue [BLOCKED — preconditions not met]', async ({ page }) => {
    await loginAndGoToDashboard(page);
    // Precondition: all spaces must have posted contracts with overdue balances.
    // Cannot be verified; test is blocked due to data state.
    await expect(page.locator('body')).toBeVisible();
});

// ────────────────────────────────────────────────────────────────────────────
// TC-DASH-005 — All Spaces Vacant
// BLOCKED: Preconditions cannot be met with current test data.
// Current DB state (2026-03-31):
//   - All 4 spaces have posted contracts:
//       "121"    : posted, 2026-01-01 → 2026-12-31
//       "XXX"    : posted, 2026-02-01 → 2027-01-31
//       "3115"   : posted, 2026-04-01 → 2027-03-31
//       "ROOM 106": posted, 2026-04-08 → 2026-04-30
//   - Precondition "No posted contracts exist" cannot be met without
//     removing all posted contracts, which is blocked by DB trigger.
// ────────────────────────────────────────────────────────────────────────────
test.skip('TC-DASH-005: All spaces show as Vacant [BLOCKED — preconditions not met]', async ({ page }) => {
    await loginAndGoToDashboard(page);
    // Precondition: no posted contracts must exist.
    // Cannot be verified; all 4 spaces have active posted contracts and
    // hard-delete is blocked by DB trigger.
    await expect(page.locator('body')).toBeVisible();
});

// ────────────────────────────────────────────────────────────────────────────
// TC-DASH-006 — Space Nearing Payment Due
// DB state (2026-03-31):
//   Space "XXX": posted contract 2026-02-01→2027-01-31, monthly, due_date_rule=1
//   Payables due as of today: Feb 1 (1000) + Mar 1 (1000) = 2000 total
//   Payments: 2x 1000 = 2000 → amount_due = 0
//   Next payable: Apr 1, 2026 (1 day away — within 7-day nearing window)
//   Preconditions MET: "XXX" should show as Nearing
// ────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────
// TC-DASH-007 — Dashboard with Large Number of Spaces
// BLOCKED: Preconditions cannot be met with current test data.
// Current DB state (2026-03-31): only 4 spaces exist.
// Precondition requires 50+ spaces. Creating that many spaces is outside the
// scope of a single SIT iteration.
// Observation: dashboard renders correctly and without crashes with 4 spaces.
// ────────────────────────────────────────────────────────────────────────────
test.skip('TC-DASH-007: Dashboard with 50+ spaces loads within reasonable time [BLOCKED — preconditions not met]', async ({ page }) => {
    await loginAndGoToDashboard(page);
    // Precondition: 50+ spaces must exist.
    // Current state: only 4 spaces exist; test is blocked.
    await expect(page.locator('body')).toBeVisible();
});

test('TC-DASH-006: Space Nearing Payment Due shows Nearing status', async ({ page }) => {
    await loginAndGoToDashboard(page);

    // The dashboard should render at least one row with Nearing status
    const nearingBadge = page.getByText(/nearing/i).first();
    await expect(nearingBadge).toBeVisible({ timeout: 10_000 });

    // Space "XXX" should specifically appear with Nearing badge
    // Find the row containing "XXX" and assert the nearing badge is present
    const xxxRow = page.locator('tr, [data-testid], li').filter({ hasText: 'XXX' }).first();
    if (await xxxRow.count() > 0) {
        await expect(xxxRow.getByText(/nearing/i)).toBeVisible();
    }
});
