import { test, expect } from '@playwright/test';

test.describe('Admin space detail', () => {
    test.beforeEach(async ({ page }) => {
        await page.context().addCookies([
            { name: 'auth_token', value: 'mock-jwt-token', domain: 'localhost', path: '/' },
        ]);
    });

    test('shows space name, description and contracts table', async ({ page }) => {
        await page.goto('/admin/spaces/space-1');
        await expect(page.getByRole('heading', { name: 'Unit 1A' })).toBeVisible();
        await expect(page.getByText('Ground floor corner unit')).toBeVisible();
        await expect(page.getByRole('table')).toBeVisible();
        await expect(page.getByText('Maria Santos')).toBeVisible();
        await expect(page.getByRole('link', { name: /view/i })).toBeVisible();
    });

    test('shows empty state when no contracts for space', async ({ page }) => {
        await page.goto('/admin/spaces/space-empty');
        await expect(page.getByText(/no contracts/i)).toBeVisible();
    });

    test('shows back link to dashboard', async ({ page }) => {
        await page.goto('/admin/spaces/space-1');
        await expect(page.getByRole('link', { name: /back to dashboard/i })).toBeVisible();
    });
});
