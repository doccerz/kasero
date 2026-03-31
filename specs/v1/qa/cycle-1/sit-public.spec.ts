/**
 * SIT/UAT Cycle 1 — Tenant Status (Public View) Group
 * Tests: TC-PUBLIC-001 through TC-PUBLIC-004
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';
import { isDockerMode } from '../../apps/web/e2e/auth-helper';

test.describe('SIT Cycle 1 — Tenant Status (Public View)', () => {
    // ─── TC-PUBLIC-001 ────────────────────────────────────────────────────────
    test('TC-PUBLIC-001: Tenant views public status via public link', async ({ page }) => {
        // Precondition: a posted contract must exist and its public access code must be known.
        // In Docker mode there are no posted contracts yet — skip (BLOCKED).
        test.skip(isDockerMode, 'BLOCKED: No posted contract exists — contract creation/posting UI not yet implemented; no public access code available');

        // Non-Docker (mock): use the VALIDCODE fixture
        await page.goto('/public/VALIDCODE');

        // Must not require login
        await expect(page).not.toHaveURL(/\/admin\/login/);

        // Amount Due section must be visible
        await expect(page.getByText(/amount due/i)).toBeVisible();

        // Payables table must be visible
        await expect(page.getByRole('table').first()).toBeVisible();
    });

    // ─── TC-PUBLIC-002 ────────────────────────────────────────────────────────
    test('TC-PUBLIC-002: Invalid or tampered public link returns error', async ({ page }) => {
        // No preconditions needed — any invalid code should return an error page.
        await page.goto('/public/this-code-does-not-exist-at-all');

        // Must NOT redirect to admin login
        await expect(page).not.toHaveURL(/\/admin\/login/);

        // Error message must be shown
        await expect(page.getByText(/invalid or expired/i)).toBeVisible();

        // No ledger data should be displayed
        await expect(page.getByText(/amount due/i)).not.toBeVisible();
    });

    // ─── TC-PUBLIC-003 ────────────────────────────────────────────────────────
    test('TC-PUBLIC-003: Public page does not expose internal IDs', async ({ page }) => {
        // Precondition: a valid public page must be accessible — requires a posted contract.
        test.skip(isDockerMode, 'BLOCKED: No posted contract exists — cannot access a valid public status page to verify no internal IDs are exposed');

        // Non-Docker (mock): use the VALIDCODE fixture
        await page.goto('/public/VALIDCODE');

        // URL must only contain the public code — no internal DB IDs
        const url = page.url();
        expect(url).toMatch(/\/public\/VALIDCODE$/);
        expect(url).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);

        // Page text must not contain any UUID-format IDs
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    });

    // ─── TC-PUBLIC-004 ────────────────────────────────────────────────────────
    test('TC-PUBLIC-004: Tenant self-entry flow', async ({ page }) => {
        // Precondition: a valid entry link (single-use token) must have been issued.
        // Entry tokens are only generated when a contract is posted.
        // In Docker mode no contracts have been posted — skip (BLOCKED).
        test.skip(isDockerMode, 'BLOCKED: No entry token has been issued — contract creation/posting UI not yet implemented; self-entry flow cannot be tested');

        // Non-Docker (mock): VALIDTOKEN is a valid single-use token fixture
        await page.goto('/entry/VALIDTOKEN');

        // Form should be visible
        await expect(page.getByRole('heading', { name: /enter your details/i })).toBeVisible();
        await expect(page.getByLabel(/first name/i)).toBeVisible();
        await expect(page.getByLabel(/last name/i)).toBeVisible();
        await expect(page.getByLabel(/consent/i)).toBeVisible();

        // Fill and submit
        await page.getByLabel(/first name/i).fill('Juan');
        await page.getByLabel(/last name/i).fill('Dela Cruz');
        await page.getByLabel(/consent/i).check();
        await page.getByRole('button', { name: /submit/i }).click();

        // Success confirmation must be shown
        await expect(page.getByText(/details submitted/i)).toBeVisible();

        // Accessing the same link again should show "already used" (single-use enforcement)
        await page.goto('/entry/USEDTOKEN');
        await expect(page.getByText(/already been submitted/i)).toBeVisible();
    });
});
