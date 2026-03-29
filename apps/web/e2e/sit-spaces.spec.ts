/**
 * SIT/UAT Cycle 1 — Spaces Management Group
 * Tests: TC-SPACE-001 through TC-SPACE-006
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';
import { setupAuth, isDockerMode } from './auth-helper';

const TEMP_SPACE_NAME = `SIT-SPACE-${Date.now()}`;
const TEMP_SPACE_DESC = 'SIT test space — safe to delete';

// Shared reference so TC-SPACE-005 can delete the space created in TC-SPACE-001
let createdSpaceId: string | null = null;

test.describe('SIT Cycle 1 — Spaces Management', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    // ─── TC-SPACE-001 ──────────────────────────────────────────────────────────
    test('TC-SPACE-001: Create a new space', async ({ page }) => {
        await page.goto('/admin/spaces');
        await expect(page.getByRole('heading', { name: 'Spaces' })).toBeVisible();

        // Open create modal
        await page.getByRole('button', { name: 'New Space' }).click();
        await expect(page.getByRole('heading', { name: 'New Space' })).toBeVisible();

        // Fill in required fields
        await page.getByPlaceholder('e.g. Unit 1A').fill(TEMP_SPACE_NAME);
        await page.getByPlaceholder('Optional description').fill(TEMP_SPACE_DESC);

        // Submit
        await page.getByRole('button', { name: 'Create' }).click();

        // Modal closes after success
        await expect(page.getByRole('heading', { name: 'New Space' })).not.toBeVisible();

        // New space appears in the list
        await expect(page.getByRole('link', { name: TEMP_SPACE_NAME })).toBeVisible();

        // Capture the href to extract the space ID for later tests
        const href = await page.getByRole('link', { name: TEMP_SPACE_NAME }).getAttribute('href');
        if (href) {
            const match = href.match(/\/admin\/spaces\/(.+)/);
            if (match) createdSpaceId = match[1];
        }
    });

    // ─── TC-SPACE-002 ──────────────────────────────────────────────────────────
    test('TC-SPACE-002: Create space with missing required fields is blocked', async ({ page }) => {
        await page.goto('/admin/spaces');
        await page.getByRole('button', { name: 'New Space' }).click();
        await expect(page.getByRole('heading', { name: 'New Space' })).toBeVisible();

        // Do NOT fill in the name (required field)
        // Click Create without filling name
        await page.getByRole('button', { name: 'Create' }).click();

        // HTML5 required validation should prevent submission — modal remains open
        await expect(page.getByRole('heading', { name: 'New Space' })).toBeVisible();
    });

    // ─── TC-SPACE-003 ──────────────────────────────────────────────────────────
    test('TC-SPACE-003: View space details', async ({ page }) => {
        await page.goto('/admin/spaces');

        // Click on the first space link to open its detail page
        const firstSpaceLink = page.locator('table tbody tr').first().getByRole('link');
        const spaceName = await firstSpaceLink.textContent();
        await firstSpaceLink.click();

        // Should navigate to /admin/spaces/<id>
        await expect(page).toHaveURL(/\/admin\/spaces\/.+/);

        // Space name should appear as heading
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(spaceName!.trim());

        // Contracts section heading is present
        await expect(page.getByText(/contracts/i)).toBeVisible();
    });

    // ─── TC-SPACE-004 ──────────────────────────────────────────────────────────
    test('TC-SPACE-004: Edit an existing space', async ({ page }) => {
        await page.goto('/admin/spaces');

        // Edit the first space in the list
        const firstRow = page.locator('table tbody tr').first();
        const originalName = await firstRow.locator('td').first().textContent();
        await firstRow.getByRole('button', { name: 'Edit' }).click();

        await expect(page.getByRole('heading', { name: 'Edit Space' })).toBeVisible();

        // Modify the description field (safer than changing name of a seed space)
        const descField = page.getByPlaceholder('Optional description');
        await descField.fill('SIT edit test — updated description');
        await page.getByRole('button', { name: 'Save' }).click();

        // Modal closes after successful save
        await expect(page.getByRole('heading', { name: 'Edit Space' })).not.toBeVisible();

        // The space name still appears in the list (confirming the row is still there)
        await expect(firstRow.locator('td').first()).toHaveText(originalName!.trim());
    });

    // ─── TC-SPACE-005 ──────────────────────────────────────────────────────────
    test('TC-SPACE-005: Soft-delete a space (no active contract)', async ({ page }) => {
        await page.goto('/admin/spaces');

        // Find the row for the space created in TC-SPACE-001 (or any row if ID not captured)
        let targetRow = createdSpaceId
            ? page.locator('tr', { hasText: TEMP_SPACE_NAME })
            : page.locator('table tbody tr').last();

        const targetName = await targetRow.locator('td').first().textContent();

        // Click Delete
        await targetRow.getByRole('button', { name: 'Delete' }).click();

        // Delete confirmation dialog appears
        await expect(page.getByRole('heading', { name: 'Delete Space' })).toBeVisible();
        await expect(page.getByText(/are you sure/i)).toBeVisible();

        // Confirm deletion
        const deleteButtons = page.getByRole('button', { name: 'Delete' });
        await deleteButtons.last().click();

        // Confirmation modal should close
        await expect(page.getByRole('heading', { name: 'Delete Space' })).not.toBeVisible();

        // Deleted space should no longer appear in the active spaces list
        if (targetName) {
            await expect(page.getByRole('link', { name: targetName.trim() })).not.toBeVisible();
        }
    });

    // ─── TC-SPACE-006 ──────────────────────────────────────────────────────────
    test('TC-SPACE-006: Deleted space does not accept new contracts', async ({ page }) => {
        // This test checks that the contract creation UI excludes deleted spaces.
        // Precondition: at least one space has been soft-deleted (TC-SPACE-005).

        // Check if the contract creation UI is available with a space selector.
        await page.goto('/admin/contracts');

        const addContractBtn = page.getByRole('button', { name: /add contract|new contract/i });
        const hasAddBtn = await addContractBtn.isVisible().catch(() => false);

        test.skip(!hasAddBtn, 'BLOCKED: No contract creation UI with space selector found — cannot verify deleted space exclusion');

        // If the button exists, open the form and verify the deleted space is absent
        await addContractBtn.click();
        const spaceSelector = page.getByRole('combobox').filter({ hasText: /space/i })
            .or(page.locator('select[name="spaceId"]'))
            .or(page.locator('[data-testid="space-select"]'));

        await expect(spaceSelector).toBeVisible();
        const options = await spaceSelector.locator('option').allTextContents();
        expect(options).not.toContain(TEMP_SPACE_NAME);
    });
});
