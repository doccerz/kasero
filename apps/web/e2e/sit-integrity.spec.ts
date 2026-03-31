/**
 * SIT/UAT Cycle 1 — Edge Cases & System Integrity Group
 * Tests: TC-INTEGRITY-001 through TC-INTEGRITY-003
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 *
 * TC-INTEGRITY-001: Timezone consistency — SKIP (requires contract creation UI; BLOCKED)
 * TC-INTEGRITY-002: Billing period alignment — SKIP (requires posted contract; BLOCKED)
 * TC-INTEGRITY-003: App loads without errors — executed
 */
import { test, expect } from '@playwright/test';
import { setupAuth } from './auth-helper';

test.skip('TC-INTEGRITY-001: Timezone consistency', async () => {
    // BLOCKED: requires contract creation UI which is not yet implemented
});

test.skip('TC-INTEGRITY-002: Billing period alignment', async () => {
    // BLOCKED: requires a posted contract with monthly billing; contract creation/posting UI not yet implemented
});

test('TC-INTEGRITY-003: App is accessible and loads without errors', async ({ page }) => {
    await setupAuth(page);

    // Step 1 — Dashboard loads
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByText(/an error occurred/i)).not.toBeVisible();
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();

    // Step 2 — Spaces section loads
    await page.goto('/admin/spaces');
    await expect(page).toHaveURL(/\/admin\/spaces/);
    await expect(page.getByText(/an error occurred/i)).not.toBeVisible();
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /spaces/i })).toBeVisible();

    // Step 3 — Tenants section loads
    await page.goto('/admin/tenants');
    await expect(page).toHaveURL(/\/admin\/tenants/);
    await expect(page.getByText(/an error occurred/i)).not.toBeVisible();
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /tenants/i })).toBeVisible();

    // Step 4 — Contracts section loads
    await page.goto('/admin/contracts');
    await expect(page).toHaveURL(/\/admin\/contracts/);
    await expect(page.getByText(/an error occurred/i)).not.toBeVisible();
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /contracts/i })).toBeVisible();

    // Step 5 — Navigation links are present (check on spaces page)
    await page.goto('/admin/spaces');
    await expect(page.getByRole('link', { name: 'Spaces' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tenants' })).toBeVisible();
});
