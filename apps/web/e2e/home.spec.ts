import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
    test('renders the access code input and submit button', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByPlaceholder(/access code/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /view status/i })).toBeVisible();
    });

    test('navigates to /public/[code] on form submit', async ({ page }) => {
        await page.goto('/');
        await page.getByPlaceholder(/access code/i).fill('ABC123');
        await page.getByRole('button', { name: /view status/i }).click();
        await expect(page).toHaveURL('/public/ABC123');
    });

    test('does not navigate when input is blank', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /view status/i }).click();
        await expect(page).toHaveURL('/');
    });
});
