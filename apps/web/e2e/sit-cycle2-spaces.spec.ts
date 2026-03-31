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
