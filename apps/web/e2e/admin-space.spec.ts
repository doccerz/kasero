import { test, expect } from '@playwright/test';
import { setupAuth, isDockerMode } from './auth-helper';

test.describe('Admin space detail', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    // Navigate to first real space in Docker mode, or mock fixture in mock mode
    async function gotoSpace1(page: import('@playwright/test').Page) {
        if (isDockerMode) {
            await page.goto('/admin/spaces');
            await page.getByRole('link', { name: 'Unit 1A' }).click();
            await page.waitForURL(/\/admin\/spaces\/.+/);
        } else {
            await page.goto('/admin/spaces/space-1');
        }
    }

    test('shows space name, description and contracts table', async ({ page }) => {
        test.skip(isDockerMode, 'Contracts table requires seeded contract data');
        await page.goto('/admin/spaces/space-1');
        await expect(page.getByRole('heading', { name: 'Unit 1A' })).toBeVisible();
        await expect(page.getByText('Ground floor corner unit')).toBeVisible();
        await expect(page.getByRole('table')).toBeVisible();
        // Use first() to avoid strict mode violation when multiple cells contain same text
        await expect(page.getByRole('cell', { name: 'Maria Santos' }).first()).toBeVisible();
    });

    test('shows empty state when no contracts for space', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture space-empty');
        await page.goto('/admin/spaces/space-empty');
        await expect(page.getByText(/no contracts/i)).toBeVisible();
    });

    test('shows back link to spaces', async ({ page }) => {
        await gotoSpace1(page);
        await expect(page.getByRole('link', { name: /back to spaces/i })).toBeVisible();
    });

    test('shows space name and description', async ({ page }) => {
        await gotoSpace1(page);
        await expect(page.getByRole('heading', { name: 'Unit 1A' })).toBeVisible();
        await expect(page.getByText('Ground floor corner unit')).toBeVisible();
    });

    // ── New Contract button ─────────────────────────────────────────────
    test('shows New Contract button', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture');
        await page.goto('/admin/spaces/space-1');
        await expect(page.getByRole('button', { name: /new contract/i })).toBeVisible();
    });

    // ── Show voided toggle ──────────────────────────────────────────────
    test('voided contracts are hidden by default', async ({ page }) => {
        test.skip(isDockerMode, 'Requires seeded voided contract');
        await page.goto('/admin/spaces/space-1');
        // contract-4 is voided — should not be visible by default
        await expect(page.getByRole('row', { name: /voided/i }).first()).not.toBeVisible();
    });

    test('show voided toggle reveals voided contracts', async ({ page }) => {
        test.skip(isDockerMode, 'Requires seeded voided contract');
        await page.goto('/admin/spaces/space-1');
        await page.getByRole('checkbox', { name: /show voided/i }).check();
        // After toggling, voided rows should appear
        await expect(page.getByText('voided').first()).toBeVisible();
    });

    // ── Row actions ─────────────────────────────────────────────────────
    test('draft row has Edit and Post buttons', async ({ page }) => {
        test.skip(isDockerMode, 'Requires seeded draft contract');
        await page.goto('/admin/spaces/space-1');
        // contract-3 is draft for space-1
        const draftRow = page.getByRole('row').filter({ hasText: 'Jose Rizal' }).filter({ hasText: 'draft' });
        await expect(draftRow.getByRole('button', { name: /edit/i })).toBeVisible();
        await expect(draftRow.getByRole('button', { name: /post/i })).toBeVisible();
    });

    test('posted row has Void button but no Edit or Post buttons', async ({ page }) => {
        test.skip(isDockerMode, 'Requires seeded posted contract');
        await page.goto('/admin/spaces/space-1');
        // contract-1 is posted for space-1
        const postedRow = page.getByRole('row').filter({ hasText: 'Maria Santos' }).filter({ hasText: 'posted' });
        await expect(postedRow.getByRole('button', { name: /void/i })).toBeVisible();
        await expect(postedRow.getByRole('button', { name: /edit/i })).not.toBeVisible();
        await expect(postedRow.getByRole('button', { name: /post/i })).not.toBeVisible();
    });

    // ── Create contract modal ───────────────────────────────────────────
    test('clicking New Contract opens create modal', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture');
        await page.goto('/admin/spaces/space-1');
        await page.getByRole('button', { name: /new contract/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: /new contract/i })).toBeVisible();
    });

    test('overlap warning shown when new contract dates conflict with existing', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture');
        await page.goto('/admin/spaces/space-1');
        await page.getByRole('button', { name: /new contract/i }).click();
        const dialog = page.getByRole('dialog');
        // Fill dates that overlap with contract-1 (2025-01-01 to 2025-12-31, posted)
        await dialog.getByLabel(/start date/i).fill('2025-06-01');
        await dialog.getByLabel(/end date/i).fill('2025-12-31');
        // Warning banner should appear
        await expect(page.getByRole('alert')).toBeVisible({ timeout: 2000 });
    });

    // ── Post confirmation ───────────────────────────────────────────────
    test('clicking Post on draft contract shows confirmation dialog', async ({ page }) => {
        test.skip(isDockerMode, 'Requires seeded draft contract');
        await page.goto('/admin/spaces/space-1');
        const draftRow = page.getByRole('row').filter({ hasText: 'Jose Rizal' }).filter({ hasText: 'draft' });
        await draftRow.getByRole('button', { name: /post/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/post this contract/i)).toBeVisible();
    });

    // ── Void confirmation ───────────────────────────────────────────────
    test('clicking Void on posted contract shows confirmation with warning', async ({ page }) => {
        test.skip(isDockerMode, 'Requires seeded posted contract');
        await page.goto('/admin/spaces/space-1');
        const postedRow = page.getByRole('row').filter({ hasText: 'Maria Santos' }).filter({ hasText: 'posted' });
        await postedRow.getByRole('button', { name: /void/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/cannot be undone/i)).toBeVisible();
    });

    // ── Delete space with active contracts (backend guard) ──────────────
    test('deleting space with active contracts shows error', async ({ page }) => {
        test.skip(isDockerMode, 'Requires seeded active contract');
        await page.goto('/admin/spaces');
        // Find a space with active contracts and click delete
        // The mock server returns 400 for DELETE /admin/spaces/space-active
        const spaceRow = page.getByRole('row').filter({ hasText: 'Unit With Contracts' });
        await spaceRow.getByRole('button', { name: /delete/i }).click();
        // Confirm deletion in dialog
        const dialog = page.getByRole('dialog');
        await dialog.getByRole('button', { name: /confirm|delete/i }).click();
        // Error message should be shown
        await expect(page.getByText(/active|draft contract/i)).toBeVisible({ timeout: 5000 });
    });
});
