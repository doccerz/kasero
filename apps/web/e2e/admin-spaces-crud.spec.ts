import { test, expect } from '@playwright/test';
import { setupAuth } from './auth-helper';

test.describe('Admin spaces CRUD', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    test('shows spaces list with all columns', async ({ page }) => {
        await page.goto('/admin/spaces');
        await expect(page.getByRole('heading', { name: 'Spaces' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Unit 1A' })).toBeVisible();
        await expect(page.getByText('Ground floor corner unit')).toBeVisible();
    });

    test('shows New Space button', async ({ page }) => {
        await page.goto('/admin/spaces');
        await expect(page.getByRole('button', { name: 'New Space' })).toBeVisible();
    });

    test('opens create modal and submits new space', async ({ page }) => {
        await page.goto('/admin/spaces');

        // Intercept browser-side POST to Next.js API route
        await page.route('**/api/admin/spaces', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: 'space-new', name: 'Penthouse A', description: 'Top floor' }),
                });
            } else {
                await route.continue();
            }
        });

        await page.getByRole('button', { name: 'New Space' }).click();
        await expect(page.getByRole('heading', { name: 'New Space' })).toBeVisible();

        await page.getByPlaceholder('e.g. Unit 1A').fill('Penthouse A');
        await page.getByPlaceholder('Optional description').fill('Top floor');
        await page.getByRole('button', { name: 'Create' }).click();

        // Modal should close after successful create
        await expect(page.getByRole('heading', { name: 'New Space' })).not.toBeVisible();
    });

    test('create modal validates required name', async ({ page }) => {
        await page.goto('/admin/spaces');
        await page.getByRole('button', { name: 'New Space' }).click();
        // Try to submit without filling name — HTML5 required validation prevents submit
        const submitButton = page.getByRole('button', { name: 'Create' });
        await submitButton.click();
        // Modal should still be open
        await expect(page.getByRole('heading', { name: 'New Space' })).toBeVisible();
    });

    test('cancel closes create modal', async ({ page }) => {
        await page.goto('/admin/spaces');
        await page.getByRole('button', { name: 'New Space' }).click();
        await expect(page.getByRole('heading', { name: 'New Space' })).toBeVisible();
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('heading', { name: 'New Space' })).not.toBeVisible();
    });

    test('opens edit modal pre-filled with Unit 1A data', async ({ page }) => {
        await page.goto('/admin/spaces');
        // Click Edit in the Unit 1A row specifically
        const unit1ARow = page.locator('tr', { hasText: 'Unit 1A' });
        await unit1ARow.getByRole('button', { name: 'Edit' }).click();

        await expect(page.getByRole('heading', { name: 'Edit Space' })).toBeVisible();
        await expect(page.getByPlaceholder('e.g. Unit 1A')).toHaveValue('Unit 1A');
        await expect(page.getByPlaceholder('Optional description')).toHaveValue('Ground floor corner unit');
    });

    test('submits edit form and closes modal', async ({ page }) => {
        await page.goto('/admin/spaces');

        await page.route('**/api/admin/spaces/**', async (route) => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: 'space-1', name: 'Unit 1A Updated', description: 'Ground floor corner unit' }),
                });
            } else {
                await route.continue();
            }
        });

        const unit1ARow = page.locator('tr', { hasText: 'Unit 1A' });
        await unit1ARow.getByRole('button', { name: 'Edit' }).click();
        await page.getByPlaceholder('e.g. Unit 1A').fill('Unit 1A Updated');
        await page.getByRole('button', { name: 'Save' }).click();

        await expect(page.getByRole('heading', { name: 'Edit Space' })).not.toBeVisible();
    });

    test('opens delete confirmation for Unit 1A', async ({ page }) => {
        await page.goto('/admin/spaces');

        await page.route('**/api/admin/spaces/**', async (route) => {
            if (route.request().method() === 'DELETE') {
                await route.fulfill({ status: 204 });
            } else {
                await route.continue();
            }
        });

        const unit1ARow = page.locator('tr', { hasText: 'Unit 1A' });
        await unit1ARow.getByRole('button', { name: 'Delete' }).click();

        await expect(page.getByRole('heading', { name: 'Delete Space' })).toBeVisible();
        await expect(page.getByText(/are you sure/i)).toBeVisible();

        // Confirm delete (last Delete button belongs to the modal)
        const deleteButtons = page.getByRole('button', { name: 'Delete' });
        await deleteButtons.last().click();

        // Confirmation modal should close
        await expect(page.getByRole('heading', { name: 'Delete Space' })).not.toBeVisible();
    });

    test('cancel closes delete confirmation', async ({ page }) => {
        await page.goto('/admin/spaces');
        const unit1ARow = page.locator('tr', { hasText: 'Unit 1A' });
        await unit1ARow.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByRole('heading', { name: 'Delete Space' })).toBeVisible();
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('heading', { name: 'Delete Space' })).not.toBeVisible();
    });

    test('shows Edit and Delete buttons per row', async ({ page }) => {
        await page.goto('/admin/spaces');
        const unit1ARow = page.locator('tr', { hasText: 'Unit 1A' });
        await expect(unit1ARow.getByRole('button', { name: 'Edit' })).toBeVisible();
        await expect(unit1ARow.getByRole('button', { name: 'Delete' })).toBeVisible();
    });
});
