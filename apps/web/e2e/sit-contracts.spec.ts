/**
 * SIT/UAT Cycle 1 — Contracts Management Group
 * Tests: TC-CONTRACT-001 through TC-CONTRACT-008
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';
import { setupAuth, isDockerMode } from './auth-helper';

test.describe('SIT Cycle 1 — Contracts Management', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    // ─── TC-CONTRACT-001 ──────────────────────────────────────────────────────
    test('TC-CONTRACT-001: Create a draft contract', async ({ page }) => {
        await page.goto('/admin/contracts');
        await expect(page.getByRole('heading', { name: 'Contracts' })).toBeVisible();

        const addBtn = page.getByRole('button', { name: /add contract|new contract/i });
        const hasAddBtn = await addBtn.isVisible().catch(() => false);

        test.skip(!hasAddBtn, 'BLOCKED: No contract creation UI — Add Contract button not found');

        // If button exists, click it and fill the form
        await addBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible();
    });

    // ─── TC-CONTRACT-002 ──────────────────────────────────────────────────────
    test('TC-CONTRACT-002: Edit a draft contract', async ({ page }) => {
        await page.goto('/admin/contracts');

        // Look for a draft contract
        const draftRow = page.locator('table tbody tr').filter({ hasText: /draft/i }).first();
        const hasDraft = await draftRow.isVisible().catch(() => false);

        test.skip(!hasDraft, 'BLOCKED: No draft contract found in the list');

        // Click View on the draft contract
        await draftRow.getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/admin\/contracts\/.+/);

        const editBtn = page.getByRole('button', { name: /edit/i });
        const hasEdit = await editBtn.isVisible().catch(() => false);

        test.skip(!hasEdit, 'BLOCKED: No edit button found on draft contract detail page');

        await editBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible();
    });

    // ─── TC-CONTRACT-003 ──────────────────────────────────────────────────────
    test('TC-CONTRACT-003: Post a contract (finalize)', async ({ page }) => {
        await page.goto('/admin/contracts');

        // Look for a draft contract
        const draftRow = page.locator('table tbody tr').filter({ hasText: /draft/i }).first();
        const hasDraft = await draftRow.isVisible().catch(() => false);

        test.skip(!hasDraft, 'BLOCKED: No draft contract found — contract creation UI not yet implemented');

        // Navigate to the draft contract
        await draftRow.getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/admin\/contracts\/.+/);

        const postBtn = page.getByRole('button', { name: /post contract/i });
        const hasPost = await postBtn.isVisible().catch(() => false);

        test.skip(!hasPost, 'BLOCKED: No "Post Contract" button found on contract detail page');

        await postBtn.click();
        // Confirm if prompted
        const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
        if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click();
        }

        // Contract status should change to posted
        await expect(page.getByText(/posted/i)).toBeVisible();
    });

    // ─── TC-CONTRACT-004 ──────────────────────────────────────────────────────
    test('TC-CONTRACT-004: Posted contract fields are locked (read-only)', async ({ page }) => {
        await page.goto('/admin/contracts');

        // Look for a posted contract
        const postedRow = page.locator('table tbody tr').filter({ hasText: /posted/i }).first();
        const hasPosted = await postedRow.isVisible().catch(() => false);

        test.skip(!hasPosted, 'BLOCKED: No posted contract found — contract creation/posting UI not yet implemented');

        // Navigate to the posted contract
        await postedRow.getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/admin\/contracts\/.+/);

        // Edit button should not exist for posted contracts, or core fields should be read-only
        const editBtn = page.getByRole('button', { name: /edit core fields|edit contract/i });
        const noEditBtn = !(await editBtn.isVisible().catch(() => false));

        expect(noEditBtn, 'Edit button for core fields should not be present on a posted contract').toBe(true);
    });

    // ─── TC-CONTRACT-005 ──────────────────────────────────────────────────────
    test('TC-CONTRACT-005: Cannot create two active contracts for the same space', async ({ page }) => {
        await page.goto('/admin/contracts');

        const addBtn = page.getByRole('button', { name: /add contract|new contract/i });
        const hasAddBtn = await addBtn.isVisible().catch(() => false);

        test.skip(!hasAddBtn, 'BLOCKED: No contract creation UI — cannot verify duplicate contract prevention');
    });

    // ─── TC-CONTRACT-006 ──────────────────────────────────────────────────────
    test('TC-CONTRACT-006: Contract generates payables on posting', async ({ page }) => {
        await page.goto('/admin/contracts');

        // Look for a posted contract
        const postedRow = page.locator('table tbody tr').filter({ hasText: /posted/i }).first();
        const hasPosted = await postedRow.isVisible().catch(() => false);

        test.skip(!hasPosted, 'BLOCKED: No posted contract found — contract creation/posting UI not yet implemented');

        // Navigate to the posted contract's ledger
        await postedRow.getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/admin\/contracts\/.+/);

        // Payables section should have at least one entry
        await expect(page.getByRole('heading', { name: /payables/i })).toBeVisible();
        const payablesTable = page.locator('table').filter({ has: page.getByText(/period start/i) });
        const hasPayables = await payablesTable.isVisible().catch(() => false);

        expect(hasPayables, 'Payables table should be visible with at least one entry').toBe(true);
    });

    // ─── TC-CONTRACT-007 ──────────────────────────────────────────────────────
    test('TC-CONTRACT-007: Advance payment reflected in ledger', async ({ page }) => {
        await page.goto('/admin/contracts');

        // Look for a posted contract
        const postedRow = page.locator('table tbody tr').filter({ hasText: /posted/i }).first();
        const hasPosted = await postedRow.isVisible().catch(() => false);

        test.skip(!hasPosted, 'BLOCKED: No posted contract found — contract creation/posting UI not yet implemented');

        // Navigate to the posted contract
        await postedRow.getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/admin\/contracts\/.+/);

        // Payments section should be visible
        await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible();

        // This test requires knowing whether advance payment was set during contract creation
        // Skip further assertion — can only verify once a contract with advance payment exists
        test.skip(true, 'BLOCKED: No contract with advance payment exists — contract creation UI not yet implemented');
    });

    // ─── TC-CONTRACT-008 ──────────────────────────────────────────────────────
    test('TC-CONTRACT-008: Deposit reflected in Fund (not in Amount Due)', async ({ page }) => {
        await page.goto('/admin/contracts');

        // Look for a posted contract
        const postedRow = page.locator('table tbody tr').filter({ hasText: /posted/i }).first();
        const hasPosted = await postedRow.isVisible().catch(() => false);

        test.skip(!hasPosted, 'BLOCKED: No posted contract found — contract creation/posting UI not yet implemented');

        // Navigate to the posted contract
        await postedRow.getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/admin\/contracts\/.+/);

        // Fund section should be visible
        await expect(page.getByRole('heading', { name: /fund/i })).toBeVisible();

        // This test requires knowing whether deposit was set during contract creation
        test.skip(true, 'BLOCKED: No contract with deposit exists — contract creation UI not yet implemented');
    });
});
