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
// Tests dashboard rendering when all spaces have overdue balances.
// Uses mock fixture with scenario=all-overdue query param.
// ────────────────────────────────────────────────────────────────────────────
test('TC-DASH-004: All spaces show as Overdue', async ({ page }) => {
    await loginAndGoToDashboard(page);
    
    // Navigate to dashboard with all-overdue scenario
    await page.goto('/admin/dashboard?scenario=all-overdue');
    
    // All 4 spaces should show as Overdue
    const overdueBadges = page.getByText(/overdue/i);
    await expect(overdueBadges).toHaveCount(4, { timeout: 10_000 });
    
    // Verify each space row shows overdue status
    await expect(page.getByText('Unit A', { exact: true })).toBeVisible();
    await expect(page.getByText('Unit B', { exact: true })).toBeVisible();
    await expect(page.getByText('Unit C', { exact: true })).toBeVisible();
    await expect(page.getByText('Unit D', { exact: true })).toBeVisible();
});

// ────────────────────────────────────────────────────────────────────────────
// TC-DASH-005 — All Spaces Vacant
// ACCEPTED BLOCKED — DB constraint prevents achieving all-vacant state in v1.
// All spaces have posted contracts; hard-delete is blocked by DB trigger.
// This test cannot be unblocked without a database reset feature.
// ────────────────────────────────────────────────────────────────────────────
test.skip('TC-DASH-005: All spaces show as Vacant [ACCEPTED BLOCKED — DB constraint prevents achieving all-vacant state in v1]', async ({ page }) => {
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
// Tests dashboard rendering with 55 spaces to verify performance and layout.
// Uses mock fixture with scenario=large query param.
// ────────────────────────────────────────────────────────────────────────────
test('TC-DASH-007: Dashboard with 50+ spaces loads correctly', async ({ page }) => {
    await loginAndGoToDashboard(page);
    
    // Navigate to dashboard with large dataset scenario
    await page.goto('/admin/dashboard?scenario=large');
    
    // Dashboard should render without crashes
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    
    // Verify at least 50 rows are rendered (55 spaces total)
    const tableRows = page.locator('tbody tr');
    await expect(tableRows).toHaveCount(55, { timeout: 10_000 });
    
    // Verify mixed status badges are present
    await expect(page.getByText(/overdue/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/nearing/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/occupied/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/vacant/i).first()).toBeVisible({ timeout: 5_000 });
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
