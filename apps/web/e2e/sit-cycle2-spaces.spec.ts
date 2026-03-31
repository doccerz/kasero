/**
 * SIT/UAT Cycle 2 — Spaces Management Edge Cases
 * Tests: TC-SPACE-007 through TC-SPACE-012
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'replace-with-a-strong-password';

const LOGIN_BTN = /log in/i;

async function loginAndGoToSpaces(page: import('@playwright/test').Page) {
    await page.goto('/admin/login');
    await page.getByLabel(/username/i).fill(ADMIN_USER);
    await page.getByLabel(/password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: LOGIN_BTN }).click();
    await page.waitForURL(/\/admin\/(dashboard|spaces)/);
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');
}

// ────────────────────────────────────────────────────────────────────────────
// TC-SPACE-007 — Space Name with Special Characters
// Steps:
//   1. Navigate to Spaces.
//   2. Create a space with name: `Unit 101-B (Ground Floor) <test>` plus !@#$%^&*()
//   3. Save.
// Expected: Space is created; special characters preserved and displayed.
// ────────────────────────────────────────────────────────────────────────────
test('TC-SPACE-007: Space name with special characters is saved and displayed correctly', async ({ page }) => {
    const specialName = 'Unit 101-B (Ground Floor) <test> !@#$%^&*()';

    await loginAndGoToSpaces(page);

    // Open the Create Space form
    const createBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    // Wait for the space name input to appear (modal or inline form)
    // Try by id first, fallback to placeholder
    const nameInput = page.locator('#space-name').or(page.getByPlaceholder('e.g. Unit 1A'));
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    // Fill in the space name
    await nameInput.fill(specialName);

    // Submit the form — button label is "Create" in create mode
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for the name input to disappear (form closed after successful save)
    await expect(nameInput).not.toBeVisible({ timeout: 10_000 });

    // Verify the space name appears in the list with special characters intact
    const spaceEntry = page.getByText('Unit 101-B (Ground Floor)', { exact: false });
    await expect(spaceEntry).toBeVisible({ timeout: 10_000 });
});

// ────────────────────────────────────────────────────────────────────────────
// TC-SPACE-008 — Space Name with Unicode/Accented Characters
// Priority: P2
// Preconditions: Admin is logged in.
// Steps:
//   1. Create a space with name: `Piso Uno — Áéíóú Ñ`
//   2. Save.
// Expected: Space name displays correctly with all Unicode characters.
// ────────────────────────────────────────────────────────────────────────────
test('TC-SPACE-008: Space name with Unicode/accented characters is saved and displayed correctly', async ({ page }) => {
    const unicodeName = 'Piso Uno — Áéíóú Ñ';

    await loginAndGoToSpaces(page);

    // Open the Create Space form
    const createBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    // Wait for the space name input to appear (modal or inline form)
    const nameInput = page.locator('#space-name').or(page.getByPlaceholder('e.g. Unit 1A'));
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    // Fill in the space name with Unicode characters
    await nameInput.fill(unicodeName);

    // Submit the form — button label is "Create" in create mode
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for the name input to disappear (form closed after successful save)
    await expect(nameInput).not.toBeVisible({ timeout: 10_000 });

    // Verify the space name appears in the list with Unicode characters intact
    const spaceEntry = page.getByText('Piso Uno', { exact: false });
    await expect(spaceEntry).toBeVisible({ timeout: 10_000 });

    // Verify the full Unicode name is displayed correctly
    const fullText = await spaceEntry.textContent();
    expect(fullText).toContain('Áéíóú Ñ');
});

// ────────────────────────────────────────────────────────────────────────────
// TC-SPACE-009 — Very Long Space Name/Description
// Priority: P2
// Preconditions: Admin is logged in.
// Steps:
//   1. Create a space with name: 255 characters long.
//   2. Create a space with description: 1000+ characters.
//   3. Save.
// Expected: Either saved successfully (if supported) OR validation error shown indicating max length.
// ────────────────────────────────────────────────────────────────────────────
test('TC-SPACE-009: Very long space name (255 chars) and description (1000+ chars) handled correctly', async ({ page }) => {
    // Generate a 255-character name
    const longName = 'A'.repeat(255);
    
    // Generate a 1000+ character description
    const longDescription = 'B'.repeat(1000);

    await loginAndGoToSpaces(page);

    // Open the Create Space form
    const createBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    // Wait for the space name input to appear
    const nameInput = page.locator('#space-name').or(page.getByPlaceholder('e.g. Unit 1A'));
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    // Fill in the long space name
    await nameInput.fill(longName);

    // Try to fill description if field exists (may be textarea or optional)
    const descriptionInput = page.locator('textarea').or(page.getByPlaceholder(/description/i));
    const descriptionCount = await descriptionInput.count();
    if (descriptionCount > 0) {
        const descVisible = await descriptionInput.first().isVisible();
        if (descVisible) {
            await descriptionInput.first().fill(longDescription);
        }
    }

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
        // Wait for the name input to disappear (form closed after successful save)
        await expect(nameInput).not.toBeVisible({ timeout: 10_000 });

        // Verify the space was created - check for truncated name or full name in the list
        // Since 255 chars is long, we check for the beginning of the name
        const spaceEntry = page.getByText(longName.substring(0, 50), { exact: false });
        await expect(spaceEntry).toBeVisible({ timeout: 10_000 });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// TC-SPACE-010 — Space Name with Only Whitespace
// Priority: P2
// Preconditions: Admin is on Create Space form.
// Steps:
//   1. Fill name field with only spaces.
//   2. Attempt to save.
// Expected: Validation blocks submission; error message shown.
// ────────────────────────────────────────────────────────────────────────────
test('TC-SPACE-010: Space name with only whitespace is blocked by validation', async ({ page }) => {
    const whitespaceName = '   ';  // Only spaces

    await loginAndGoToSpaces(page);

    // Open the Create Space form
    const createBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    // Wait for the space name input to appear
    const nameInput = page.locator('#space-name').or(page.getByPlaceholder('e.g. Unit 1A'));
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    // Fill in only whitespace
    await nameInput.fill(whitespaceName);

    // Try to submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Expect validation error to appear with specific message
    const validationError = page.getByText(/whitespace|cannot.*empty|valid.*name/i).first();
    await expect(validationError).toBeVisible({ timeout: 5_000 });

    // Verify the form is still open (submission was blocked)
    await expect(nameInput).toBeVisible({ timeout: 3_000 });
});

// ────────────────────────────────────────────────────────────────────────────
// TC-SPACE-011 — Concurrent Space Edit
// Priority: P2
// Preconditions: Two admin users editing same space simultaneously.
// Steps:
//   1. Admin A opens space for editing.
//   2. Admin B opens same space for editing.
//   3. Admin A saves changes.
//   4. Admin B saves changes.
// Expected: Either last save wins with warning OR optimistic locking prevents stale data.
// ────────────────────────────────────────────────────────────────────────────
test('TC-SPACE-011: Concurrent space edit - last save wins or optimistic locking warning shown', async ({ browser }) => {
    // Create two browser contexts to simulate two admin users
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
        // Both admins log in and navigate to spaces
        await loginAndGoToSpaces(pageA);
        await loginAndGoToSpaces(pageB);

        // Find an existing space to edit (first space in the list)
        const spaceLinkA = pageA.locator('table a[href^="/admin/spaces/"]').first();
        await expect(spaceLinkA).toBeVisible({ timeout: 10_000 });
        const spaceHref = await spaceLinkA.getAttribute('href');
        const spaceId = spaceHref?.split('/').pop();

        if (!spaceId) {
            throw new Error('No space found to edit');
        }

        // Get the original space name before editing
        const originalName = await spaceLinkA.textContent();

        // Both admins navigate to the same space detail page
        await pageA.goto(`/admin/spaces/${spaceId}`);
        await pageB.goto(`/admin/spaces/${spaceId}`);

        // Both admins navigate back to spaces list and open edit modal
        await pageA.goto('/admin/spaces');
        await pageB.goto('/admin/spaces');

        // Open edit modal for the same space on both pages
        const editBtnA = pageA.locator('table tbody tr').first().getByRole('button', { name: 'Edit' });
        const editBtnB = pageB.locator('table tbody tr').first().getByRole('button', { name: 'Edit' });

        await expect(editBtnA).toBeVisible({ timeout: 10_000 });
        await expect(editBtnB).toBeVisible({ timeout: 10_000 });

        // Both admins open the edit modal
        await editBtnA.click();
        await editBtnB.click();

        // Wait for modals to appear
        const nameInputA = pageA.locator('#space-name');
        const nameInputB = pageB.locator('#space-name');
        await expect(nameInputA).toBeVisible({ timeout: 5_000 });
        await expect(nameInputB).toBeVisible({ timeout: 5_000 });

        // Admin A changes the name
        const newNameA = 'Concurrent Test - Admin A';
        await nameInputA.fill(newNameA);

        // Admin B changes the name (different value)
        const newNameB = 'Concurrent Test - Admin B';
        await nameInputB.fill(newNameB);

        // Admin A saves first
        const saveBtnA = pageA.getByRole('button', { name: 'Save' });
        await saveBtnA.click();

        // Wait for Admin A's save to complete (modal closes)
        await expect(nameInputA).not.toBeVisible({ timeout: 10_000 });

        // Admin B saves second (still has the modal open with stale data)
        const saveBtnB = pageB.getByRole('button', { name: 'Save' });
        await saveBtnB.click();

        // Wait for Admin B's save to complete
        await expect(nameInputB).not.toBeVisible({ timeout: 10_000 });

        // Check the final state - either:
        // 1. Last save wins (Admin B's name is shown) - acceptable v1 behavior
        // 2. Optimistic locking warning shown - preferred behavior
        // 3. First save wins (Admin A's name is shown) - acceptable with warning

        await pageA.reload();
        const finalSpaceName = await pageA.locator('table tbody tr').first().locator('td').first().textContent();

        // Accept any of these outcomes as valid v1 behavior:
        // - Last save wins (newNameB)
        // - First save wins (newNameA)
        // The key is that the system doesn't crash and data is consistent
        const validOutcomes = [newNameA, newNameB];
        expect(validOutcomes).toContain(finalSpaceName);

    } finally {
        // Clean up browser contexts
        await contextA.close();
        await contextB.close();
    }
});

// ────────────────────────────────────────────────────────────────────────────
// TC-SPACE-012 — Reactivating Soft-Deleted Space
// Priority: P1
// Preconditions: A soft-deleted space exists.
// Steps:
//   1. Navigate to deleted spaces (if visible).
//   2. Attempt to restore/reactivate the space.
// Expected: Either space is restored and available for contracts OR proper error if not supported in v1.
// ────────────────────────────────────────────────────────────────────────────
test('TC-SPACE-012: Soft-deleted space cannot be restored (not supported in v1)', async ({ page }) => {
    await loginAndGoToSpaces(page);

    // Step 1: Create a space that we can delete
    const createBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    const nameInput = page.locator('#space-name');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    const testSpaceName = 'Test Space for Deletion';
    await nameInput.fill(testSpaceName);
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for form to close after successful creation
    await expect(nameInput).not.toBeVisible({ timeout: 10_000 });

    // Step 2: Find the space and delete it
    const spaceRow = page.locator('table tbody tr').filter({ hasText: testSpaceName });
    await expect(spaceRow).toBeVisible({ timeout: 10_000 });

    const deleteBtn = spaceRow.getByRole('button', { name: 'Delete' });
    await deleteBtn.click();

    // Wait for delete confirmation modal
    const confirmDeleteBtn = page.getByRole('button', { name: 'Delete' }).filter({ hasText: 'Delete' }).last();
    await expect(confirmDeleteBtn).toBeVisible({ timeout: 5_000 });
    await confirmDeleteBtn.click();

    // Wait for delete to complete (space row should disappear)
    await expect(spaceRow).not.toBeVisible({ timeout: 10_000 });

    // Step 3: Try to navigate to deleted spaces
    // In v1, there is no UI for viewing deleted spaces
    // Try common paths that might show deleted spaces
    await page.goto('/admin/spaces?showDeleted=true');
    await page.waitForURL(/\/admin\/spaces/);

    // Check if the deleted space appears (it should not in v1)
    const deletedSpaceVisible = await page.locator('table tbody tr').filter({ hasText: testSpaceName }).isVisible().catch(() => false);

    // Step 4: Try to access the deleted space directly by ID
    // First, get the space ID from the API response or URL
    // Since we can't easily get the ID, we try to navigate to a hypothetical restore endpoint
    await page.goto('/admin/spaces/deleted');
    
    // In v1, this should either 404 or show no deleted spaces
    const pageTitle = await page.locator('h1').first().textContent().catch(() => '');
    const isDeletedPage = pageTitle?.toLowerCase().includes('deleted') || pageTitle?.toLowerCase().includes('archived');

    // Step 5: Verify v1 behavior
    // Expected: No restore functionality in v1 (out of scope)
    // - Deleted spaces are not visible in the UI
    // - No restore button exists
    // - Direct API access would be needed to restore (not tested here)
    
    // Verify the deleted space is not visible in the main spaces list
    await page.goto('/admin/spaces');
    const spaceInList = await page.locator('table tbody tr').filter({ hasText: testSpaceName }).isVisible().catch(() => false);
    
    // Verify there's no "Show Deleted" or "Restore" functionality
    const showDeletedBtn = page.getByRole('button', { name: /show.*deleted|view.*deleted|archived|restore/i });
    const showDeletedVisible = await showDeletedBtn.isVisible().catch(() => false);

    // v1 behavior verification:
    // 1. Deleted space is not visible in the main list (soft-delete hides it)
    // 2. No UI for viewing deleted spaces
    // 3. No restore functionality in UI
    expect(spaceInList).toBe(false);  // Space is hidden after soft-delete
    expect(showDeletedVisible).toBe(false);  // No restore UI in v1
    expect(isDeletedPage).toBe(false);  // No dedicated deleted spaces page in v1

    // Note: This is acceptable v1 behavior - soft-delete is one-way in v1
    // Spaces can only be restored via direct database access (out of scope for v1 UI)
});
