/**
 * SIT/UAT Cycle 1 — Authentication Group
 * Tests: TC-AUTH-001 through TC-AUTH-005
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'replace-with-a-strong-password';

// Login button text is "Log in" (with space)
const LOGIN_BTN = /log in/i;

test('TC-AUTH-001: Admin login happy path', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel(/username/i).fill(ADMIN_USER);
    await page.getByLabel(/password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: LOGIN_BTN }).click();
    await expect(page).toHaveURL(/\/admin\/(dashboard)?/);
    await expect(page.getByText(/invalid/i)).not.toBeVisible();
});

test('TC-AUTH-002: Login with wrong password shows error', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel(/username/i).fill(ADMIN_USER);
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: LOGIN_BTN }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    // Backend returns "Unauthorized"; form shows whatever error message the API sends
    await expect(page.getByText(/unauthorized|invalid|error/i)).toBeVisible();
});

test('TC-AUTH-003: Login with empty fields shows validation', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByRole('button', { name: LOGIN_BTN }).click();
    // HTML5 required fields prevent submission — confirm we stay on login
    await expect(page).toHaveURL(/\/admin\/login/);
});

test('TC-AUTH-004: Access protected page without login redirects to login', async ({ page }) => {
    await page.goto('/admin/spaces');
    await expect(page).toHaveURL(/\/admin\/login/);
});

test('TC-AUTH-005: Admin logout redirects to login page', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.getByLabel(/username/i).fill(ADMIN_USER);
    await page.getByLabel(/password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: LOGIN_BTN }).click();
    await expect(page).toHaveURL(/\/admin\/(dashboard)?/);

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);

    // Verify protected page requires re-auth
    await page.goto('/admin/spaces');
    await expect(page).toHaveURL(/\/admin\/login/);
});
