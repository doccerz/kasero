import { test, expect } from '@playwright/test';
import { setupAuth } from './auth-helper';

test.describe('Admin navigation cleanup (Phase 7)', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    test('nav shows only Spaces and Tenants links', async ({ page }) => {
        await page.goto('/admin/spaces');
        const nav = page.locator('nav');
        await expect(nav.getByRole('link', { name: 'Spaces' })).toBeVisible();
        await expect(nav.getByRole('link', { name: 'Tenants' })).toBeVisible();
        await expect(nav.getByRole('link', { name: 'Dashboard' })).not.toBeVisible();
        await expect(nav.getByRole('link', { name: 'Contracts' })).not.toBeVisible();
        await expect(nav.getByRole('link', { name: 'Profile' })).not.toBeVisible();
    });

    test('sidebar header shows a clickable profile link', async ({ page }) => {
        await page.goto('/admin/spaces');
        const sidebar = page.locator('aside');
        // The header area should have a link to /admin/profile
        const profileLink = sidebar.getByRole('link', { name: /admin/i }).first();
        await expect(profileLink).toBeVisible();
        await expect(profileLink).toHaveAttribute('href', '/admin/profile');
    });
});
