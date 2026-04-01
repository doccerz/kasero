import { test, expect } from '@playwright/test';

test.describe('Home page (combined landing)', () => {
    test('renders the access code input and submit button', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByPlaceholder(/access code/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /view status/i })).toBeVisible();
    });

    test('renders the admin login form', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByLabel(/username/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
    });

    test('navigates to /public/[code] on form submit', async ({ page }) => {
        await page.goto('/');
        await page.getByPlaceholder(/access code/i).fill('ABC123');
        await page.getByRole('button', { name: /view status/i }).click();
        await expect(page).toHaveURL('/public/ABC123');
    });

    test('does not navigate when access code input is blank', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /view status/i }).click();
        await expect(page).toHaveURL('/');
    });

    test('shows error on bad admin credentials', async ({ page }) => {
        await page.route('**/api/auth/login', (route) => {
            route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Invalid credentials' }),
            });
        });
        await page.goto('/');
        await page.getByLabel(/username/i).fill('admin');
        await page.getByLabel(/password/i).fill('wrongpassword');
        await page.getByRole('button', { name: /log in/i }).click();
        await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    });

    test('redirects to spaces on successful admin login', async ({ page }) => {
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true }),
                headers: { 'Set-Cookie': 'auth_token=eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9.mock; Path=/; HttpOnly' },
            });
        });
        await page.goto('/');
        await page.getByLabel(/username/i).fill('admin');
        await page.getByLabel(/password/i).fill('password');
        await page.getByRole('button', { name: /log in/i }).click();
        await expect(page).toHaveURL('/admin/spaces');
    });

    test('redirects to /admin/spaces when already logged in', async ({ page, context }) => {
        await context.addCookies([{
            name: 'auth_token',
            value: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9.mock',
            domain: 'localhost',
            path: '/',
        }]);
        await page.goto('/');
        await expect(page).toHaveURL('/admin/spaces');
    });
});
