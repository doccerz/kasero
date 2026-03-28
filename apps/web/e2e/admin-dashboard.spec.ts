import { test, expect } from '@playwright/test';

test.describe('Admin dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.context().addCookies([
            { name: 'auth_token', value: 'mock-jwt-token', domain: 'localhost', path: '/' },
        ]);
    });

    test('shows spaces table with status badges', async ({ page }) => {
        await page.goto('/admin/dashboard');
        await expect(page.getByRole('table')).toBeVisible();
        await expect(page.getByText('Unit 1A')).toBeVisible();
        await expect(page.getByText('Unit 4D')).toBeVisible();
        await expect(page.getByText('Overdue')).toBeVisible();
        await expect(page.getByText('Nearing')).toBeVisible();
        await expect(page.getByText('Occupied')).toBeVisible();
        await expect(page.getByText('Vacant')).toBeVisible();
        await expect(page.getByText('Maria Santos')).toBeVisible();
    });

    test('shows sidebar navigation', async ({ page }) => {
        await page.goto('/admin/dashboard');
        await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
    });

    test('space name links navigate to space detail', async ({ page }) => {
        await page.goto('/admin/dashboard');
        await page.getByRole('link', { name: 'Unit 1A' }).click();
        await expect(page).toHaveURL('/admin/spaces/space-1');
    });
});
