import { test, expect } from '@playwright/test';

test.describe('Admin login page', () => {
    test('renders login form', async ({ page }) => {
        await page.goto('/admin/login');
        await expect(page.getByLabel(/username/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
    });

    test('shows error on bad credentials', async ({ page }) => {
        // Intercept the browser-side POST to /api/auth/login (Next.js Route Handler)
        await page.route('**/api/auth/login', (route) => {
            route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Invalid credentials' }),
            });
        });
        await page.goto('/admin/login');
        await page.getByLabel(/username/i).fill('admin');
        await page.getByLabel(/password/i).fill('wrongpassword');
        await page.getByRole('button', { name: /log in/i }).click();
        await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    });

    test('redirects to spaces on successful login', async ({ page }) => {
        // Intercept the browser-side POST to /api/auth/login (Next.js Route Handler)
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true }),
                headers: { 'Set-Cookie': 'auth_token=eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9.mock; Path=/; HttpOnly' },
            });
        });
        await page.goto('/admin/login');
        await page.getByLabel(/username/i).fill('admin');
        await page.getByLabel(/password/i).fill('password');
        await page.getByRole('button', { name: /log in/i }).click();
        await expect(page).toHaveURL('/admin/spaces');
    });
});
