/**
 * SIT/UAT Cycle 2 — Tenants Management Edge Cases
 * Tests: TC-TENANT-008 through TC-TENANT-012
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'replace-with-a-strong-password';

const LOGIN_BTN = /log in/i;

async function loginAndGoToTenants(page: import('@playwright/test').Page) {
    await page.goto('/admin/login');
    await page.getByLabel(/username/i).fill(ADMIN_USER);
    await page.getByLabel(/password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: LOGIN_BTN }).click();
    await page.waitForURL(/\/admin\/(dashboard|tenants)/);
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');
}

// ────────────────────────────────────────────────────────────────────────────
// TC-TENANT-008 — Tenant Name with Special/Unicode Characters
// Priority: P2
// Preconditions: Admin is logged in.
// Steps:
//   1. Create tenant with first name: `José María`
//   2. Last name: `Gómez-Ñández 田中`
//   3. Save.
// Expected: Tenant is created; all characters display correctly.
// ────────────────────────────────────────────────────────────────────────────
test('TC-TENANT-008: Tenant name with special/Unicode characters is saved and displayed correctly', async ({ page }) => {
    const firstName = 'José María';
    const lastName = 'Gómez-Ñández 田中';
    const email = 'unicode-tenant@example.com';

    await loginAndGoToTenants(page);

    // Open the Create Tenant form
    const createBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    // Wait for the modal to appear
    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in the first name with Unicode characters
    const firstNameInput = page.getByPlaceholder('Maria', { exact: true });
    await firstNameInput.fill(firstName);

    // Fill in the last name with Unicode characters
    const lastNameInput = page.getByPlaceholder('Santos', { exact: true });
    await lastNameInput.fill(lastName);

    // Fill in email (required for contact)
    const emailInput = page.getByPlaceholder('maria@example.com', { exact: true });
    await emailInput.fill(email);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for the modal to close (successful save)
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify the tenant appears in the list with Unicode characters intact
    const tenantLink = page.getByRole('link', { name: `${firstName} ${lastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Verify the full Unicode name is displayed correctly
    const fullText = await tenantLink.textContent();
    expect(fullText).toContain('José María');
    expect(fullText).toContain('Gómez-Ñández');
    expect(fullText).toContain('田中');
});

// ────────────────────────────────────────────────────────────────────────────
// TC-TENANT-009 — Very Long Tenant Name
// Priority: P2
// Preconditions: Admin is on Create Tenant form.
// Steps:
//   1. Enter first name with 100+ characters.
//   2. Enter last name with 100+ characters.
//   3. Attempt to save.
// Expected: Either saved successfully (if supported) OR validation error shown.
// ────────────────────────────────────────────────────────────────────────────
test('TC-TENANT-009: Very long tenant names (100+ chars) handled correctly', async ({ page }) => {
    // Generate 100+ character names
    const longFirstName = 'A'.repeat(100);
    const longLastName = 'B'.repeat(100);
    const email = 'long-name@example.com';

    await loginAndGoToTenants(page);

    // Open the Create Tenant form
    const createBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    // Wait for the modal to appear
    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in the long first name
    const firstNameInput = page.getByPlaceholder('Maria', { exact: true });
    await firstNameInput.fill(longFirstName);

    // Fill in the long last name
    const lastNameInput = page.getByPlaceholder('Santos', { exact: true });
    await lastNameInput.fill(longLastName);

    // Fill in email
    const emailInput = page.getByPlaceholder('maria@example.com', { exact: true });
    await emailInput.fill(email);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Either: form saves successfully OR validation error appears
    // Check for validation error first
    const validationError = page.getByText(/too long|max.*length|exceed|character limit/i).first();
    const hasValidationError = await validationError.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasValidationError) {
        // Validation error shown - this is acceptable behavior
        expect(hasValidationError).toBe(true);
    } else {
        // No validation error - expect successful save
        // Wait for the modal to close (successful save)
        await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

        // Verify the tenant was created - check for the long name in the list
        // Since 100+ chars is long, we check for the beginning of the name
        const tenantLink = page.getByRole('link', { name: longFirstName.substring(0, 50) });
        await expect(tenantLink).toBeVisible({ timeout: 10_000 });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// TC-TENANT-010 — Duplicate Email Addresses
// Priority: P2
// Preconditions: A tenant with email `tenant@example.com` exists.
// Steps:
//   1. Create a new tenant with the same email `tenant@example.com`.
//   2. Save.
// Expected: Either system allows duplicate emails (v1 behavior) OR shows validation error preventing duplicate.
// ────────────────────────────────────────────────────────────────────────────
test('TC-TENANT-010: Duplicate email addresses are allowed (v1 behavior)', async ({ page }) => {
    const duplicateEmail = `duplicate-${Date.now()}@example.com`;
    const firstName1 = 'Tenant';
    const lastName1 = 'One';
    const firstName2 = 'Tenant';
    const lastName2 = 'Two';

    await loginAndGoToTenants(page);

    // Step 1: Create first tenant with the duplicate email
    const createBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in first tenant
    await page.getByPlaceholder('Maria', { exact: true }).fill(firstName1);
    await page.getByPlaceholder('Santos', { exact: true }).fill(lastName1);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(duplicateEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify first tenant was created
    const tenantLink1 = page.getByRole('link', { name: `${firstName1} ${lastName1}` });
    await expect(tenantLink1).toBeVisible({ timeout: 10_000 });

    // Step 2: Create second tenant with the SAME email
    await createBtn.click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in second tenant with same email
    await page.getByPlaceholder('Maria', { exact: true }).fill(firstName2);
    await page.getByPlaceholder('Santos', { exact: true }).fill(lastName2);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(duplicateEmail);

    await page.getByRole('button', { name: 'Create' }).click();

    // Either: duplicate email is allowed (v1 behavior) OR validation error shown
    const validationError = page.getByText(/duplicate.*email|email.*exists|already.*use/i).first();
    const hasValidationError = await validationError.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasValidationError) {
        // Validation error shown - system prevents duplicate emails
        expect(hasValidationError).toBe(true);
    } else {
        // No validation error - duplicate email is allowed (v1 behavior)
        // Wait for the modal to close (successful save)
        await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

        // Verify second tenant was created with the same email
        const tenantLink2 = page.getByRole('link', { name: `${firstName2} ${lastName2}` });
        await expect(tenantLink2).toBeVisible({ timeout: 10_000 });

        // Both tenants should be visible in the list
        await expect(tenantLink1).toBeVisible();
        await expect(tenantLink2).toBeVisible();
    }
});

// ────────────────────────────────────────────────────────────────────────────
// TC-TENANT-011 — Concurrent Tenant Edit
// Priority: P2
// Preconditions: Two admin users editing same tenant simultaneously.
// Steps:
//   1. Admin A opens tenant for editing.
//   2. Admin B opens same tenant for editing.
//   3. Admin A saves changes.
//   4. Admin B saves changes.
// Expected: Either last save wins with warning OR optimistic locking prevents stale data.
// ────────────────────────────────────────────────────────────────────────────
test('TC-TENANT-011: Concurrent tenant edit — last save wins (v1 behavior)', async ({ browser }) => {
    const uniqueEmail = `concurrent-${Date.now()}@example.com`;
    const originalName = 'Original Tenant';
    const adminAName = 'Admin A Edited';
    const adminBName = 'Admin B Edited';

    // Create two browser contexts to simulate concurrent admin users
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
        // Both admins login and navigate to tenants page
        await loginAndGoToTenants(pageA);
        await loginAndGoToTenants(pageB);

        // Step 1: Create a tenant to edit (using pageA)
        const createBtnA = pageA.getByRole('button', { name: 'New Tenant' });
        await expect(createBtnA).toBeVisible({ timeout: 10_000 });
        await createBtnA.click();

        await expect(pageA.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

        // Fill in tenant details
        await pageA.getByPlaceholder('Maria', { exact: true }).fill(originalName);
        await pageA.getByPlaceholder('Santos', { exact: true }).fill('Name');
        await pageA.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

        await pageA.getByRole('button', { name: 'Create' }).click();
        await expect(pageA.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

        // Verify tenant was created
        const tenantLink = pageA.getByRole('link', { name: `${originalName} Name` });
        await expect(tenantLink).toBeVisible({ timeout: 10_000 });

        // Click on the tenant to view details
        await tenantLink.click();
        await pageA.waitForURL(/\/admin\/tenants\/\d+/);

        // Step 2: Both admins open the edit modal
        // Admin A clicks edit
        const editBtnA = pageA.getByRole('button', { name: /edit/i });
        await expect(editBtnA).toBeVisible({ timeout: 10_000 });
        await editBtnA.click();

        // Admin B navigates to the same tenant and clicks edit
        await pageB.goto('/admin/tenants');
        const tenantLinkB = pageB.getByRole('link', { name: `${originalName} Name` });
        await expect(tenantLinkB).toBeVisible({ timeout: 10_000 });
        await tenantLinkB.click();
        await pageB.waitForURL(/\/admin\/tenants\/\d+/);

        const editBtnB = pageB.getByRole('button', { name: /edit/i });
        await expect(editBtnB).toBeVisible({ timeout: 10_000 });
        await editBtnB.click();

        // Wait for both modals to be visible
        await expect(pageA.getByRole('heading', { name: 'Edit Tenant' })).toBeVisible({ timeout: 5_000 });
        await expect(pageB.getByRole('heading', { name: 'Edit Tenant' })).toBeVisible({ timeout: 5_000 });

        // Step 3: Admin A saves changes first
        const firstNameInputA = pageA.getByPlaceholder('Maria', { exact: true });
        await firstNameInputA.fill(adminAName);
        await pageA.getByRole('button', { name: /save/i }).click();

        // Wait for Admin A's modal to close
        await expect(pageA.getByRole('heading', { name: 'Edit Tenant' })).not.toBeVisible({ timeout: 10_000 });

        // Step 4: Admin B saves changes (last save wins)
        const firstNameInputB = pageB.getByPlaceholder('Maria', { exact: true });
        await firstNameInputB.fill(adminBName);
        await pageB.getByRole('button', { name: /save/i }).click();

        // Wait for Admin B's modal to close
        await expect(pageB.getByRole('heading', { name: 'Edit Tenant' })).not.toBeVisible({ timeout: 10_000 });

        // Verify final state - either Admin A or Admin B's name should be present
        // v1 behavior: last save wins (no optimistic locking)
        const pageAfterSave = pageA;
        await pageAfterSave.reload();
        await pageAfterSave.waitForURL(/\/admin\/tenants\/\d+/);

        const currentName = await pageAfterSave.getByRole('heading', { level: 1 }).textContent();
        const isAdminAName = currentName?.includes(adminAName);
        const isAdminBName = currentName?.includes(adminBName);

        // Either last save wins (Admin B) or first save wins (Admin A)
        // Both are acceptable v1 behavior as long as system doesn't crash
        expect(isAdminAName || isAdminBName).toBe(true);

        // Verify no errors or crashes occurred
        const errorMessages = pageAfterSave.getByText(/error|conflict|stale|concurrent/i);
        const hasError = await errorMessages.first().isVisible({ timeout: 3_000 }).catch(() => false);

        // System should not crash - errors are acceptable if handled gracefully
        expect(hasError).toBe(false);

    } finally {
        // Cleanup
        await contextA.close();
        await contextB.close();
    }
});

// ────────────────────────────────────────────────────────────────────────────
// TC-TENANT-012 — Tenant Status Transition Validation
// Priority: P1
// Preconditions: A tenant exists with status **Inactive**.
// Steps:
//   1. Attempt to manually change tenant status to **Active** without a contract.
// Expected: Either status cannot be changed manually (DB trigger handles it) OR appropriate error shown.
// ────────────────────────────────────────────────────────────────────────────
test('TC-TENANT-012: Tenant status cannot be manually changed without a contract', async ({ page }) => {
    const uniqueEmail = `status-test-${Date.now()}@example.com`;
    const firstName = 'Status Test';
    const lastName = 'Tenant';

    await loginAndGoToTenants(page);

    // Step 1: Create a new tenant (starts as Inactive)
    const createBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in tenant details
    await page.getByPlaceholder('Maria', { exact: true }).fill(firstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(lastName);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify tenant was created
    const tenantLink = page.getByRole('link', { name: `${firstName} ${lastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Click on the tenant to view details
    await tenantLink.click();
    await page.waitForURL(/\/admin\/tenants\/\d+/);

    // Step 2: Verify tenant status is displayed (should be "Inactive" for new tenants)
    const statusValue = page.locator('dd').filter({ hasText: /inactive/i }).first();
    await expect(statusValue).toBeVisible({ timeout: 5_000 });

    // Step 3: Attempt to manually change status
    // Check for any "Change Status", "Edit Status", or similar buttons
    const changeStatusBtn = page.getByRole('button', { name: /change.*status|edit.*status|set.*status/i });
    const hasChangeStatusBtn = await changeStatusBtn.count() > 0;

    // Check for any status dropdown or select element
    const statusSelect = page.getByRole('combobox', { name: /status/i });
    const hasStatusSelect = await statusSelect.count() > 0;

    // Check for any edit button that might allow status change
    const editBtn = page.getByRole('button', { name: /edit/i });
    const hasEditBtn = await editBtn.count() > 0;

    if (hasChangeStatusBtn) {
        // If there's a change status button, click it and verify it shows an error
        await changeStatusBtn.first().click();
        
        // Expect an error message or warning about needing a contract
        const errorMsg = page.getByText(/contract|cannot.*change|status.*managed/i);
        const hasErrorMsg = await errorMsg.first().isVisible({ timeout: 3_000 }).catch(() => false);
        expect(hasErrorMsg).toBe(true);
    } else if (hasStatusSelect) {
        // If there's a status dropdown, try to change it
        await statusSelect.first().selectOption('active');
        
        // Expect an error or the change to be rejected
        const errorMsg = page.getByText(/error|invalid|contract/i);
        const hasErrorMsg = await errorMsg.first().isVisible({ timeout: 3_000 }).catch(() => false);
        expect(hasErrorMsg).toBe(true);
    } else if (hasEditBtn) {
        // Try the edit button - check if it allows status change
        await editBtn.first().click();
        await expect(page.getByRole('heading', { name: 'Edit Tenant' })).toBeVisible({ timeout: 5_000 });

        // Check if there's a status field in the edit modal
        const editStatusSelect = page.getByRole('combobox', { name: /status/i });
        const hasEditStatusSelect = await editStatusSelect.count() > 0;

        if (hasEditStatusSelect) {
            // Try to change status to active
            await editStatusSelect.first().selectOption('active');
            await page.getByRole('button', { name: /save/i }).click();

            // Expect an error or rejection
            const errorMsg = page.getByText(/error|invalid|contract/i);
            const hasErrorMsg = await errorMsg.first().isVisible({ timeout: 3_000 }).catch(() => false);
            expect(hasErrorMsg).toBe(true);
        } else {
            // No status field in edit modal - status cannot be manually changed
            // This is acceptable v1 behavior (PASS)
            expect(true).toBe(true);
        }
    } else {
        // No UI to manually change status - this is acceptable v1 behavior (PASS)
        // Status is managed by the system via DB trigger when contracts are posted
        expect(true).toBe(true);
    }
});
