import { test, expect } from '@playwright/test';
import { setupAuth } from './auth-helper';

test.describe('Spaces page — occupancy dashboard integration (Phase 8)', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    test('/admin/dashboard redirects to /admin/spaces', async ({ page }) => {
        await page.goto('/admin/dashboard');
        await expect(page).toHaveURL(/\/admin\/spaces/);
    });

    test('Spaces page shows occupancy status badges', async ({ page }) => {
        await page.goto('/admin/spaces');
        const overdueBadge = page.locator('span').filter({ hasText: /^overdue$/i });
        await expect(overdueBadge.first()).toBeVisible();
        const vacantBadge = page.locator('span').filter({ hasText: /^vacant$/i });
        await expect(vacantBadge.first()).toBeVisible();
    });

    test('Spaces page shows tenant name for occupied spaces', async ({ page }) => {
        await page.goto('/admin/spaces');
        await expect(page.getByText('Maria Santos')).toBeVisible();
    });

    test('Spaces page shows amount due for occupied spaces', async ({ page }) => {
        await page.goto('/admin/spaces');
        await expect(page.getByText('₱12000.00')).toBeVisible();
    });

    test('Spaces page shows next due date', async ({ page }) => {
        await page.goto('/admin/spaces');
        await expect(page.getByText('2026-03-01')).toBeVisible();
    });

    test('login redirects to /admin/spaces after successful login', async ({ page }) => {
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true }),
                headers: { 'Set-Cookie': 'auth_token=mock-jwt-token; Path=/; HttpOnly' },
            });
        });
        await page.goto('/admin/login');
        await page.getByLabel(/username/i).fill('admin');
        await page.getByLabel(/password/i).fill('password');
        await page.getByRole('button', { name: /log in/i }).click();
        await expect(page).toHaveURL(/\/admin\/spaces/);
    });
});
