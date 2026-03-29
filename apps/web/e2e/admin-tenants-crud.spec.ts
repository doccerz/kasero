import { test, expect } from '@playwright/test';
import { setupAuth } from './auth-helper';

test.describe('Admin tenants CRUD', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    test('shows tenants list with name, email, phone', async ({ page }) => {
        await page.goto('/admin/tenants');
        await expect(page.getByRole('heading', { name: 'Tenants' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Maria Santos' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Jose Rizal' })).toBeVisible();
        await expect(page.getByText('maria@example.com')).toBeVisible();
    });

    test('shows New Tenant button', async ({ page }) => {
        await page.goto('/admin/tenants');
        await expect(page.getByRole('button', { name: 'New Tenant' })).toBeVisible();
    });

    test('opens create modal with all fields', async ({ page }) => {
        await page.goto('/admin/tenants');
        await page.getByRole('button', { name: 'New Tenant' }).click();

        await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible();
        await expect(page.getByPlaceholder('Maria', { exact: true })).toBeVisible();
        await expect(page.getByPlaceholder('Santos', { exact: true })).toBeVisible();
        await expect(page.getByPlaceholder('maria@example.com', { exact: true })).toBeVisible();
    });

    test('submits create form and closes modal', async ({ page }) => {
        await page.goto('/admin/tenants');

        await page.route('**/api/admin/tenants', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'tenant-new',
                        firstName: 'Emilio',
                        lastName: 'Aguinaldo',
                        status: 'active',
                        contactInfo: { email: 'emilio@example.com' },
                    }),
                });
            } else {
                await route.continue();
            }
        });

        await page.getByRole('button', { name: 'New Tenant' }).click();
        await page.getByPlaceholder('Maria', { exact: true }).fill('Emilio');
        await page.getByPlaceholder('Santos', { exact: true }).fill('Aguinaldo');
        await page.getByPlaceholder('maria@example.com', { exact: true }).fill('emilio@example.com');
        await page.getByRole('button', { name: 'Create' }).click();

        await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible();
    });

    test('create modal validates required first and last name', async ({ page }) => {
        await page.goto('/admin/tenants');
        await page.getByRole('button', { name: 'New Tenant' }).click();
        // Submit without required fields — HTML5 validation prevents it
        await page.getByRole('button', { name: 'Create' }).click();
        await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible();
    });

    test('cancel closes create modal', async ({ page }) => {
        await page.goto('/admin/tenants');
        await page.getByRole('button', { name: 'New Tenant' }).click();
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible();
    });

    test('opens edit modal pre-filled with Maria Santos data', async ({ page }) => {
        await page.goto('/admin/tenants');
        // Click Edit in the Maria Santos row specifically
        const mariaRow = page.locator('tr', { hasText: 'Maria Santos' });
        await mariaRow.getByRole('button', { name: 'Edit' }).click();

        await expect(page.getByRole('heading', { name: 'Edit Tenant' })).toBeVisible();
        await expect(page.getByPlaceholder('Maria', { exact: true })).toHaveValue('Maria');
        await expect(page.getByPlaceholder('Santos', { exact: true })).toHaveValue('Santos');
        await expect(page.getByPlaceholder('maria@example.com', { exact: true })).toHaveValue('maria@example.com');
    });

    test('submits edit form and closes modal', async ({ page }) => {
        await page.goto('/admin/tenants');

        await page.route('**/api/admin/tenants/**', async (route) => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'tenant-1',
                        firstName: 'Maria Clara',
                        lastName: 'Santos',
                        status: 'active',
                        contactInfo: { email: 'maria@example.com', phone: '+63 912 000 0001' },
                    }),
                });
            } else {
                await route.continue();
            }
        });

        const mariaRow = page.locator('tr', { hasText: 'Maria Santos' });
        await mariaRow.getByRole('button', { name: 'Edit' }).click();
        await page.getByPlaceholder('Maria', { exact: true }).fill('Maria Clara');
        await page.getByRole('button', { name: 'Save' }).click();

        await expect(page.getByRole('heading', { name: 'Edit Tenant' })).not.toBeVisible();
    });

    test('shows Edit button per row', async ({ page }) => {
        await page.goto('/admin/tenants');
        const mariaRow = page.locator('tr', { hasText: 'Maria Santos' });
        await expect(mariaRow.getByRole('button', { name: 'Edit' })).toBeVisible();
    });

    test('tenant detail page shows correct name and contact info', async ({ page }) => {
        await page.goto('/admin/tenants');
        await page.getByRole('link', { name: 'Maria Santos' }).click();
        await page.waitForURL(/\/admin\/tenants\/.+/);
        await expect(page.getByRole('heading', { name: 'Maria Santos' })).toBeVisible();
        await expect(page.getByText('maria@example.com')).toBeVisible();
        await expect(page.getByText('+63 912 000 0001')).toBeVisible();
    });

    test('tenant detail shows back link to tenants list', async ({ page }) => {
        await page.goto('/admin/tenants');
        await page.getByRole('link', { name: 'Maria Santos' }).click();
        await page.waitForURL(/\/admin\/tenants\/.+/);
        await expect(page.getByRole('link', { name: /back to tenants/i })).toBeVisible();
    });
});
