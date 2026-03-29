import { test, expect } from '@playwright/test';
import { setupAuth } from './auth-helper';

test.describe('Admin dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    test('shows spaces table with at least one space', async ({ page }) => {
        await page.goto('/admin/dashboard');
        await expect(page.getByRole('table')).toBeVisible();
        await expect(page.getByText('Unit 1A')).toBeVisible();
        // Status badges are present (at least Vacant is always shown for unseeded spaces)
        const badges = page.locator('span').filter({ hasText: /overdue|nearing|occupied|vacant/i });
        await expect(badges.first()).toBeVisible();
    });

    test('shows sidebar navigation', async ({ page }) => {
        await page.goto('/admin/dashboard');
        await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
    });

    test('space name links navigate to space detail', async ({ page }) => {
        await page.goto('/admin/dashboard');
        await page.getByRole('link', { name: 'Unit 1A' }).click();
        await expect(page).toHaveURL(/\/admin\/spaces\/.+/);
    });
});
