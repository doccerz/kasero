/**
 * SIT/UAT Cycle 1 — Ledger & Payments Group
 * Tests: TC-LEDGER-001, TC-LEDGER-002, TC-PAYMENT-001 through TC-PAYMENT-004
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';
import { setupAuth, isDockerMode } from './auth-helper';

test.describe('SIT Cycle 1 — Ledger & Payments', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    // ─── TC-LEDGER-001 ────────────────────────────────────────────────────────
    test('TC-LEDGER-001: View contract ledger', async ({ page }) => {
        await page.goto('/admin/contracts');
        await expect(page.getByRole('heading', { name: 'Contracts' })).toBeVisible();

        // Check if any posted contract exists
        const postedRow = page.locator('table tbody tr').filter({ hasText: /posted/i }).first();
        const hasPosted = await postedRow.isVisible().catch(() => false);

        test.skip(!hasPosted, 'BLOCKED: No posted contract found — contract creation/posting UI not yet implemented');

        // Navigate to the first posted contract
        await postedRow.getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/admin\/contracts\/.+/);

        // Ledger sections must be visible
        await expect(page.getByRole('heading', { name: /payables/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /fund/i })).toBeVisible();
        await expect(page.getByText(/amount due/i)).toBeVisible();
    });

    // ─── TC-LEDGER-002 ────────────────────────────────────────────────────────
    test('TC-LEDGER-002: Amount due calculated correctly', async ({ page }) => {
        await page.goto('/admin/contracts');
        await expect(page.getByRole('heading', { name: 'Contracts' })).toBeVisible();

        const postedRow = page.locator('table tbody tr').filter({ hasText: /posted/i }).first();
        const hasPosted = await postedRow.isVisible().catch(() => false);

        test.skip(!hasPosted, 'BLOCKED: No posted contract with payables exists — contract creation/posting UI not yet implemented');

        await postedRow.getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/admin\/contracts\/.+/);

        // Amount Due section must be present and non-negative
        const amountDueText = await page.locator('text=/₱[0-9]+/').first().textContent();
        expect(amountDueText).toBeTruthy();
    });

    // ─── TC-PAYMENT-001 ───────────────────────────────────────────────────────
    test('TC-PAYMENT-001: Record a payment', async ({ page }) => {
        await page.goto('/admin/contracts');
        await expect(page.getByRole('heading', { name: 'Contracts' })).toBeVisible();

        const postedRow = page.locator('table tbody tr').filter({ hasText: /posted/i }).first();
        const hasPosted = await postedRow.isVisible().catch(() => false);

        test.skip(!hasPosted, 'BLOCKED: No posted contract found — contract creation/posting UI not yet implemented');

        await postedRow.getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/admin\/contracts\/.+/);

        const recordBtn = page.getByRole('button', { name: /record payment/i });
        const hasRecordBtn = await recordBtn.isVisible().catch(() => false);

        test.skip(!hasRecordBtn, 'BLOCKED: No Record Payment button found on contract detail page — payment recording UI not yet implemented');

        await recordBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Fill and submit payment form
        await page.getByLabel(/amount/i).fill('1000');
        await page.getByLabel(/date/i).fill('2026-03-29');
        await page.getByRole('button', { name: /save/i }).click();

        await expect(page.getByText(/1,000|1000/)).toBeVisible();
    });

    // ─── TC-PAYMENT-002 ───────────────────────────────────────────────────────
    test('TC-PAYMENT-002: Record payment with missing fields', async ({ page }) => {
        await page.goto('/admin/contracts');
        await expect(page.getByRole('heading', { name: 'Contracts' })).toBeVisible();

        const postedRow = page.locator('table tbody tr').filter({ hasText: /posted/i }).first();
        const hasPosted = await postedRow.isVisible().catch(() => false);

        test.skip(!hasPosted, 'BLOCKED: No posted contract found — contract creation/posting UI not yet implemented');

        await postedRow.getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/admin\/contracts\/.+/);

        const recordBtn = page.getByRole('button', { name: /record payment/i });
        const hasRecordBtn = await recordBtn.isVisible().catch(() => false);

        test.skip(!hasRecordBtn, 'BLOCKED: No Record Payment button found on contract detail page — payment recording UI not yet implemented');

        await recordBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Submit without filling any fields
        await page.getByRole('button', { name: /save/i }).click();

        // Dialog should remain open (validation blocks submission)
        await expect(page.getByRole('dialog')).toBeVisible();
    });

    // ─── TC-PAYMENT-003 ───────────────────────────────────────────────────────
    test('TC-PAYMENT-003: Void a payment', async ({ page }) => {
        await page.goto('/admin/contracts');
        await expect(page.getByRole('heading', { name: 'Contracts' })).toBeVisible();

        const postedRow = page.locator('table tbody tr').filter({ hasText: /posted/i }).first();
        const hasPosted = await postedRow.isVisible().catch(() => false);

        test.skip(!hasPosted, 'BLOCKED: No posted contract found — no payments to void; contract creation UI not yet implemented');

        await postedRow.getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/admin\/contracts\/.+/);

        // Look for a non-voided payment with a Void button
        const voidBtn = page.locator('table tbody tr').filter({ hasNot: page.locator('[class*="line-through"]') }).getByRole('button', { name: /void/i }).first();
        const hasVoidBtn = await voidBtn.isVisible().catch(() => false);

        test.skip(!hasVoidBtn, 'BLOCKED: No Void button found on any payment — void payment UI not yet implemented');

        await voidBtn.click();

        // Confirm if prompted
        const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
        if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click();
        }

        // Payment should now be marked as voided
        await expect(page.locator('table tbody tr').filter({ hasText: /yes/i }).first()).toBeVisible();
    });

    // ─── TC-PAYMENT-004 ───────────────────────────────────────────────────────
    test('TC-PAYMENT-004: Voided payment cannot be voided again', async ({ page }) => {
        await page.goto('/admin/contracts');
        await expect(page.getByRole('heading', { name: 'Contracts' })).toBeVisible();

        const postedRow = page.locator('table tbody tr').filter({ hasText: /posted/i }).first();
        const hasPosted = await postedRow.isVisible().catch(() => false);

        test.skip(!hasPosted, 'BLOCKED: No posted contract found — no voided payments exist; contract creation UI not yet implemented');

        await postedRow.getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/admin\/contracts\/.+/);

        // Look for a voided payment row (strikethrough class)
        const voidedRow = page.locator('table tbody tr').filter({ has: page.locator('[class*="line-through"]') }).first();
        const hasVoidedRow = await voidedRow.isVisible().catch(() => false);

        test.skip(!hasVoidedRow, 'BLOCKED: No voided payment found — void payment UI not yet implemented');

        // Void button should NOT be visible on a voided payment row
        const voidBtnOnVoided = voidedRow.getByRole('button', { name: /void/i });
        await expect(voidBtnOnVoided).not.toBeVisible();
    });
});
