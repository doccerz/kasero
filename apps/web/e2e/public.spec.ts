import { test, expect } from '@playwright/test';

test.describe('Public access page', () => {
    test('shows amount due and payables table for valid code', async ({ page }) => {
        await page.goto('/public/VALIDCODE');
        await expect(page.getByText(/amount due/i)).toBeVisible();
        await expect(page.getByRole('table').first()).toBeVisible();
        await expect(page.getByText('2026-01-01')).toBeVisible();
    });

    test('shows fund section when fund entries exist', async ({ page }) => {
        await page.goto('/public/VALIDCODE');
        await expect(page.getByText(/deposit/i)).toBeVisible();
    });

    test('shows error for invalid access code', async ({ page }) => {
        await page.goto('/public/BADCODE');
        await expect(page.getByText(/invalid or expired/i)).toBeVisible();
    });
});
