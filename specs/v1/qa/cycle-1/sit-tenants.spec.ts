/**
 * SIT/UAT Cycle 1 — Tenants Management Group
 * Tests: TC-TENANT-001 through TC-TENANT-007
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';
import { setupAuth, isDockerMode } from './auth-helper';

const TEMP_TENANT_FIRST = `SIT`;
const TEMP_TENANT_LAST = `Tenant-${Date.now()}`;
const TEMP_TENANT_EMAIL = `sit-tenant-${Date.now()}@example.com`;

// Shared reference so TC-TENANT-004 can edit the tenant created in TC-TENANT-001
let createdTenantName: string | null = null;

test.describe('SIT Cycle 1 — Tenants Management', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    // ─── TC-TENANT-001 ────────────────────────────────────────────────────────
    test('TC-TENANT-001: Create a new tenant', async ({ page }) => {
        await page.goto('/admin/tenants');
        await expect(page.getByRole('heading', { name: 'Tenants' })).toBeVisible();

        // Open create modal
        await page.getByRole('button', { name: 'New Tenant' }).click();
        await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible();

        // Fill required fields
        await page.getByPlaceholder('Maria', { exact: true }).fill(TEMP_TENANT_FIRST);
        await page.getByPlaceholder('Santos', { exact: true }).fill(TEMP_TENANT_LAST);
        await page.getByPlaceholder('maria@example.com', { exact: true }).fill(TEMP_TENANT_EMAIL);

        // Submit
        await page.getByRole('button', { name: 'Create' }).click();

        // Modal should close on success
        await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible();

        // New tenant appears in the list
        createdTenantName = `${TEMP_TENANT_FIRST} ${TEMP_TENANT_LAST}`;
        await expect(page.getByRole('link', { name: createdTenantName })).toBeVisible();
    });

    // ─── TC-TENANT-002 ────────────────────────────────────────────────────────
    test('TC-TENANT-002: Create tenant with missing required fields is blocked', async ({ page }) => {
        await page.goto('/admin/tenants');
        await page.getByRole('button', { name: 'New Tenant' }).click();
        await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible();

        // Do NOT fill in firstName or lastName (required)
        // Click Create without filling required fields
        await page.getByRole('button', { name: 'Create' }).click();

        // HTML5 required validation should prevent submission — modal remains open
        await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible();
    });

    // ─── TC-TENANT-003 ────────────────────────────────────────────────────────
    test('TC-TENANT-003: View tenant details', async ({ page }) => {
        await page.goto('/admin/tenants');

        // Click the first tenant link to open their detail page
        const firstTenantLink = page.locator('table tbody tr').first().getByRole('link');
        const tenantName = await firstTenantLink.textContent();
        await firstTenantLink.click();

        // Should navigate to /admin/tenants/<id>
        await expect(page).toHaveURL(/\/admin\/tenants\/.+/);

        // Tenant name should appear as heading
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(tenantName!.trim());

        // Personal info section should be visible
        await expect(page.getByRole('term', { name: 'Email' }).or(page.getByText('Email'))).toBeVisible();
        await expect(page.getByRole('term', { name: 'Status' }).or(page.getByText('Status'))).toBeVisible();

        // Contracts section heading is present
        await expect(page.getByRole('heading', { name: /contracts/i })).toBeVisible();

        // Back link to tenants list
        await expect(page.getByRole('link', { name: /back to tenants/i })).toBeVisible();
    });

    // ─── TC-TENANT-004 ────────────────────────────────────────────────────────
    test('TC-TENANT-004: Edit tenant information', async ({ page }) => {
        await page.goto('/admin/tenants');

        // Edit the first row (or the one created in TC-TENANT-001 if available)
        const targetRow = createdTenantName
            ? page.locator('tr', { hasText: createdTenantName })
            : page.locator('table tbody tr').first();

        await targetRow.getByRole('button', { name: 'Edit' }).click();
        await expect(page.getByRole('heading', { name: 'Edit Tenant' })).toBeVisible();

        // Modify the phone field (optional field, safe to change)
        const phoneField = page.getByPlaceholder('+63 912 345 6789');
        await phoneField.fill('+63 900 123 0001');

        await page.getByRole('button', { name: 'Save' }).click();

        // Modal should close after successful save
        await expect(page.getByRole('heading', { name: 'Edit Tenant' })).not.toBeVisible();
    });

    // ─── TC-TENANT-005 ────────────────────────────────────────────────────────
    test('TC-TENANT-005: Tenant cannot be deleted — no delete button exists', async ({ page }) => {
        await page.goto('/admin/tenants');

        // Check that no Delete button exists in any row
        const deleteButtons = page.getByRole('button', { name: /delete/i });
        await expect(deleteButtons).toHaveCount(0);

        // Also verify the list is showing tenants (so this isn't vacuously true on empty page)
        const rows = page.locator('table tbody tr');
        await expect(rows.first()).toBeVisible();
    });

    // ─── TC-TENANT-006 ────────────────────────────────────────────────────────
    test('TC-TENANT-006: Tenant status is Active on contract start', async ({ page }) => {
        test.skip(
            true,
            'BLOCKED: Precondition not met — no posted contract with start date ≤ today exists in current DB state; contract creation UI not yet implemented',
        );

        // When precondition is met: navigate to a tenant with a posted active contract
        await page.goto('/admin/tenants');
        // Find a tenant known to have an active posted contract
        const activeRow = page.locator('table tbody tr').filter({ hasText: /active/i }).first();
        await activeRow.getByRole('link').click();
        await expect(page).toHaveURL(/\/admin\/tenants\/.+/);
        await expect(page.getByText(/active/i)).toBeVisible();
    });

    // ─── TC-TENANT-007 ────────────────────────────────────────────────────────
    test('TC-TENANT-007: Tenant status is Inactive after contract ends', async ({ page }) => {
        test.skip(
            true,
            'BLOCKED: Precondition not met — no expired contract exists in current DB state; contract creation UI not yet implemented',
        );

        // When precondition is met: navigate to a tenant whose contract has expired
        await page.goto('/admin/tenants');
        const inactiveRow = page.locator('table tbody tr').filter({ hasText: /inactive/i }).first();
        await inactiveRow.getByRole('link').click();
        await expect(page).toHaveURL(/\/admin\/tenants\/.+/);
        await expect(page.getByText(/inactive/i)).toBeVisible();
    });
});
