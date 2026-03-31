import { test, expect } from '@playwright/test';
import { setupAuth, isDockerMode } from './auth-helper';

test.describe('Admin space detail', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    // Navigate to first real space in Docker mode, or mock fixture in mock mode
    async function gotoSpace1(page: import('@playwright/test').Page) {
        if (isDockerMode) {
            await page.goto('/admin/spaces');
            await page.getByRole('link', { name: 'Unit 1A' }).click();
            await page.waitForURL(/\/admin\/spaces\/.+/);
        } else {
            await page.goto('/admin/spaces/space-1');
        }
    }

    test('shows space name, description and contracts table', async ({ page }) => {
        test.skip(isDockerMode, 'Contracts table requires seeded contract data');
        await page.goto('/admin/spaces/space-1');
        await expect(page.getByRole('heading', { name: 'Unit 1A' })).toBeVisible();
        await expect(page.getByText('Ground floor corner unit')).toBeVisible();
        await expect(page.getByRole('table')).toBeVisible();
        await expect(page.getByText('Maria Santos')).toBeVisible();
        await expect(page.getByRole('link', { name: /view/i })).toBeVisible();
    });

    test('shows empty state when no contracts for space', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture space-empty');
        await page.goto('/admin/spaces/space-empty');
        await expect(page.getByText(/no contracts/i)).toBeVisible();
    });

    test('shows back link to spaces', async ({ page }) => {
        await gotoSpace1(page);
        await expect(page.getByRole('link', { name: /back to spaces/i })).toBeVisible();
    });

    test('contracts are sorted: posted first, then draft, then voided', async ({ page }) => {
        test.skip(isDockerMode, 'Requires seeded multi-contract fixture');
        await page.goto('/admin/spaces/space-1');
        const rows = page.locator('tbody tr');
        const firstStatus = rows.first().locator('td').nth(3);
        await expect(firstStatus).toHaveText('posted');
    });

    test('voided contracts have muted row styling', async ({ page }) => {
        test.skip(isDockerMode, 'Requires seeded voided contract');
        await page.goto('/admin/spaces/space-1');
        const rows = page.locator('tbody tr');
        // last row should be voided (after sorting)
        const lastRow = rows.last();
        await expect(lastRow).toHaveClass(/text-slate-400/);
    });

    test('shows space name and description', async ({ page }) => {
        await gotoSpace1(page);
        await expect(page.getByRole('heading', { name: 'Unit 1A' })).toBeVisible();
        await expect(page.getByText('Ground floor corner unit')).toBeVisible();
    });
});
