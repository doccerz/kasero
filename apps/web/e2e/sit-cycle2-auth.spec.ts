/**
 * SIT/UAT Cycle 2 — Authentication Edge Cases
 * Tests: TC-AUTH-006 through TC-AUTH-010
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';
import * as jwt from 'jsonwebtoken';

const ADMIN_USER = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'replace-with-a-strong-password';
const JWT_SECRET = process.env.JWT_SECRET ?? 'replace-with-a-long-random-secret';

const LOGIN_BTN = /log in/i;

async function loginAs(page: import('@playwright/test').Page, username = ADMIN_USER, password = ADMIN_PASS) {
    await page.goto('/admin/login');
    await page.getByLabel(/username/i).fill(username);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: LOGIN_BTN }).click();
}

// ────────────────────────────────────────────────────────────────────────────
// TC-AUTH-009 — SQL Injection in Login Fields
// ────────────────────────────────────────────────────────────────────────────
test('TC-AUTH-009: SQL injection in username field does not expose data or error', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel(/username/i).fill("' OR 1=1 --");
    await page.getByLabel(/password/i).fill('anypassword');
    await page.getByRole('button', { name: LOGIN_BTN }).click();

    // Should stay on login page (not redirected to admin area)
    await expect(page).not.toHaveURL(/\/admin\/(?!login)/);

    // No SQL error text exposed
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/sql|syntax error|pg|postgres|exception|stack trace/i);
});

// ────────────────────────────────────────────────────────────────────────────
// TC-AUTH-007 — Login with Malformed Token
// ────────────────────────────────────────────────────────────────────────────
test('TC-AUTH-007: Malformed auth_token cookie redirects to login page', async ({ page, context }) => {
    // Inject a clearly malformed (non-JWT) value as the auth cookie
    await context.addCookies([
        {
            name: 'auth_token',
            value: 'this-is-not-a-valid-jwt-token',
            domain: 'localhost',
            path: '/',
        },
    ]);

    // Attempt to access a protected page
    await page.goto('/admin/spaces');

    // Expect redirect to login
    await expect(page).toHaveURL(/\/admin\/login/);
});

// ────────────────────────────────────────────────────────────────────────────
// TC-AUTH-010 — XSS Attempt in Login Fields
// ────────────────────────────────────────────────────────────────────────────
test('TC-AUTH-010: XSS script tag in username field is escaped and does not execute', async ({ page }) => {
    await page.goto('/admin/login');

    // Track whether any dialog (alert) fires
    let alertFired = false;
    page.on('dialog', async (dialog) => {
        alertFired = true;
        await dialog.dismiss();
    });

    await page.getByLabel(/username/i).fill("<script>alert('xss')</script>");
    await page.getByLabel(/password/i).fill('anypassword');
    await page.getByRole('button', { name: LOGIN_BTN }).click();

    // Give a moment for any dialog to fire
    await page.waitForTimeout(500);

    // No alert should have fired
    expect(alertFired).toBe(false);

    // Should stay on login page
    await expect(page).not.toHaveURL(/\/admin\/(?!login)/);

    // Script tag should not appear unescaped in the DOM or cause visible script execution
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/alert\('xss'\)/);
});

// ────────────────────────────────────────────────────────────────────────────
// TC-AUTH-006 — Login with Expired Token
// ────────────────────────────────────────────────────────────────────────────
test('TC-AUTH-006: Expired JWT token redirects to login page', async ({ page, context }) => {
    // Create a token that expired 1 hour ago
    const expiredToken = jwt.sign(
        { sub: 'admin', username: ADMIN_USER },
        JWT_SECRET,
        { expiresIn: -3600 }, // expired 1 hour ago
    );

    // Inject the expired token as the auth cookie
    await context.addCookies([
        {
            name: 'auth_token',
            value: expiredToken,
            domain: 'localhost',
            path: '/',
        },
    ]);

    // Attempt to access a protected page
    await page.goto('/admin/spaces');

    // Expect redirect to login
    await expect(page).toHaveURL(/\/admin\/login/);
});
