import { test, expect } from '@playwright/test';
import { isDockerMode } from './auth-helper';

test.describe('Entry form page', () => {
    test.beforeEach(async () => {
        test.skip(isDockerMode, 'Entry token tests require mock server fixtures (VALIDTOKEN, USEDTOKEN)');
    });

    test('shows form for valid token', async ({ page }) => {
        await page.goto('/entry/VALIDTOKEN');
        await expect(page.getByRole('heading', { name: /enter your details/i })).toBeVisible();
        await expect(page.getByLabel(/first name/i)).toBeVisible();
        await expect(page.getByLabel(/last name/i)).toBeVisible();
    });

    test('shows error message for invalid token', async ({ page }) => {
        await page.goto('/entry/BADTOKEN');
        await expect(page.getByText(/invalid or expired/i)).toBeVisible();
    });

    test('shows already-used message for used token', async ({ page }) => {
        await page.goto('/entry/USEDTOKEN');
        await expect(page.getByText(/already been submitted/i)).toBeVisible();
    });

    test('shows success state after form submission', async ({ page }) => {
        await page.route('**/internal/tenants/entry/VALIDTOKEN', (route) => {
            if (route.request().method() === 'POST') {
                route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
            } else {
                route.continue();
            }
        });
        await page.goto('/entry/VALIDTOKEN');
        await page.getByLabel(/first name/i).fill('Juan');
        await page.getByLabel(/last name/i).fill('Dela Cruz');
        await page.getByLabel(/phone/i).fill('09171234567');
        await page.getByLabel(/email/i).fill('juan@example.com');
        await page.getByLabel(/consent/i).check();
        await page.getByRole('button', { name: /submit/i }).click();
        await expect(page.getByText(/details submitted/i)).toBeVisible();
    });

    test('shows error when submission fails', async ({ page }) => {
        await page.route('**/internal/tenants/entry/ERRORTOKEN', (route) => {
            if (route.request().method() === 'POST') {
                route.fulfill({
                    status: 422,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'Validation failed' }),
                });
            } else {
                route.continue();
            }
        });
        await page.goto('/entry/ERRORTOKEN');
        await page.getByLabel(/first name/i).fill('Juan');
        await page.getByLabel(/last name/i).fill('Dela Cruz');
        await page.getByLabel(/consent/i).check();
        await page.getByRole('button', { name: /submit/i }).click();
        await expect(page.getByText(/validation failed/i)).toBeVisible();
    });
});
