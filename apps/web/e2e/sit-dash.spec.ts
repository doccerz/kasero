/**
 * SIT/UAT Cycle 1 — Dashboard Group
 * Tests: TC-DASH-001 through TC-DASH-003
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';
import { setupAuth } from './auth-helper';

test.describe('SIT Cycle 1 — Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    test('TC-DASH-001: Dashboard loads with space summary', async ({ page }) => {
        await page.goto('/admin/spaces');
        // Heading is visible
        await expect(page.getByRole('heading', { name: /spaces/i })).toBeVisible();
        // Either a table with spaces or an empty-state message
        const table = page.getByRole('table');
        const emptyMsg = page.getByText(/no spaces found/i);
        const hasTable = await table.isVisible().catch(() => false);
        const hasEmpty = await emptyMsg.isVisible().catch(() => false);
        expect(hasTable || hasEmpty).toBe(true);
        // If table is present, at least one status badge must exist
        if (hasTable) {
            const badges = page.locator('span').filter({ hasText: /overdue|nearing|occupied|vacant/i });
            await expect(badges.first()).toBeVisible();
        }
    });

    test('TC-DASH-002: Overdue space appears at top of dashboard', async ({ page }) => {
        await page.goto('/admin/spaces');
        const overdueBadges = page.locator('span').filter({ hasText: /overdue/i });
        const count = await overdueBadges.count();
        // Precondition: a space with overdue balance must exist
        test.skip(count === 0, 'BLOCKED: No space with an overdue contract found in current DB — precondition not met');
        // Overdue badge visible and in the first row
        await expect(overdueBadges.first()).toBeVisible();
        const firstRowStatus = page.locator('tbody tr').first().locator('span').filter({ hasText: /overdue|nearing|occupied|vacant/i });
        await expect(firstRowStatus).toHaveText(/overdue/i);
    });

    test('TC-DASH-003: Vacant space appears on dashboard', async ({ page }) => {
        await page.goto('/admin/spaces');
        // At least one vacant badge should be visible
        const vacantBadge = page.locator('span').filter({ hasText: /vacant/i });
        await expect(vacantBadge.first()).toBeVisible();
    });
});
