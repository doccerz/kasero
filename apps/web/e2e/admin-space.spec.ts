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

    test('shows back link to dashboard', async ({ page }) => {
        await gotoSpace1(page);
        await expect(page.getByRole('link', { name: /back to dashboard/i })).toBeVisible();
    });

    test('shows space name and description', async ({ page }) => {
        await gotoSpace1(page);
        await expect(page.getByRole('heading', { name: 'Unit 1A' })).toBeVisible();
        await expect(page.getByText('Ground floor corner unit')).toBeVisible();
    });
});
