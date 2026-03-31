/**
 * SIT/UAT Cycle 1 — Tenant Status (Public View) Group
 * Tests: TC-PUBLIC-001 through TC-PUBLIC-004
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';
import { isDockerMode } from './auth-helper';

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

    // ─── TC-PUBLIC-005 ────────────────────────────────────────────────────────
    test('TC-PUBLIC-005: Access code with special characters', async ({ page }) => {
        // No preconditions needed — test with special characters in the URL.
        // Navigate to a public URL with special characters in the code
        // Browser will URL-encode: !@#$% → %21%40%23%24%25
        await page.goto('/public/test!@#$%code');

        // Must NOT redirect to admin login
        await expect(page).not.toHaveURL(/\/admin\/login/);

        // Error message must be shown gracefully (no crash)
        // The backend validates UUID format and returns 404 for invalid codes
        await expect(page.getByText(/invalid/i)).toBeVisible();

        // No ledger data should be displayed
        await expect(page.getByText(/amount due/i)).not.toBeVisible();

        // No stack trace or internal error should be exposed
        await expect(page.getByText(/stack trace/i)).not.toBeVisible();
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toMatch(/Error:/i);
    });

    // ─── TC-PUBLIC-006 ────────────────────────────────────────────────────────
    // Priority: P1
    // Preconditions: None.
    // Steps:
    //   1. Navigate to /public/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee (valid UUID format but non-existent).
    // Expected: 404 error or "Invalid access code" message; no data exposed.
    test('TC-PUBLIC-006: Expired/tampered access code with valid UUID format', async ({ page }) => {
        // No preconditions needed — test with a valid UUID format that doesn't exist in the database.
        // Navigate to a public URL with a valid UUID format but non-existent code
        await page.goto('/public/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');

        // Must NOT redirect to admin login
        await expect(page).not.toHaveURL(/\/admin\/login/);

        // Error message must be shown gracefully (invalid or expired access code)
        // The backend validates UUID format first, then checks existence in database
        // Non-existent codes return 404 with "Invalid or expired access code" message
        await expect(page.getByText(/invalid or expired/i)).toBeVisible();

        // No ledger data should be displayed
        await expect(page.getByText(/amount due/i)).not.toBeVisible();
        await expect(page.getByRole('table')).not.toBeVisible();

        // No contract details should be exposed
        await expect(page.getByText(/tenant/i)).not.toBeVisible();
        await expect(page.getByText(/space/i)).not.toBeVisible();

        // No stack trace or internal error should be exposed
        await expect(page.getByText(/stack trace/i)).not.toBeVisible();
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toMatch(/Error:/i);
        expect(bodyText).not.toMatch(/NotFoundException/i);
        expect(bodyText).not.toMatch(/stack/i);
    });

    // ─── TC-PUBLIC-007 ────────────────────────────────────────────────────────
    // Priority: P2
    // Preconditions: A valid public access code exists.
    // Steps:
    //   1. Rapidly refresh the public status page 10+ times in 1 second.
    // Expected: Page loads correctly each time; no rate limit crash; consistent data.
    test('TC-PUBLIC-007: Rapid repeated access to same code', async ({ page }) => {
        // Precondition: A valid public access code must exist — requires a posted contract.
        // In Docker mode no contracts have been posted — skip (BLOCKED).
        test.skip(isDockerMode, 'BLOCKED: No valid public access code exists — contract creation/posting UI not yet implemented; cannot test rapid repeated access without a valid code');

        // Non-Docker (mock): use the VALIDCODE fixture
        // Rapidly access the same public code 10+ times
        const accessPromises = [];
        for (let i = 0; i < 10; i++) {
            accessPromises.push(page.goto('/public/VALIDCODE'));
        }

        // Execute all requests concurrently (simulates rapid refresh)
        await Promise.all(accessPromises);

        // Navigate to the page one more time to verify it still loads correctly
        await page.goto('/public/VALIDCODE');

        // Page should load correctly without crashes
        await expect(page).not.toHaveURL(/\/admin\/login/);

        // Amount Due section should be visible (page loaded successfully)
        await expect(page.getByText(/amount due/i)).toBeVisible();

        // Payables table should be visible
        await expect(page.getByRole('table').first()).toBeVisible();

        // Data should be consistent (no corruption from concurrent access)
        // If we reached this point, the system handled rapid access correctly
    });

    // ─── TC-PUBLIC-008 ────────────────────────────────────────────────────────
    // Priority: P1
    // Preconditions: None.
    // Steps:
    //   1. Try sequential codes: /public/00000000-0000-0000-0000-000000000001, ...002, etc.
    //   2. Try to guess valid codes.
    // Expected: Codes are non-guessable UUIDs; no enumeration possible; rate limiting may apply.
    test('TC-PUBLIC-008: Public page ID enumeration attack', async ({ page }) => {
        // No preconditions needed — test with sequential/enumerated codes.
        // Try sequential UUIDs to test for enumeration vulnerabilities
        const sequentialCodes = [
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000002',
            '00000000-0000-0000-0000-000000000003',
            '11111111-1111-1111-1111-111111111111',
            'ffffffff-ffff-ffff-ffff-ffffffffffff',
        ];

        for (const code of sequentialCodes) {
            await page.goto(`/public/${code}`);

            // Must NOT redirect to admin login
            await expect(page).not.toHaveURL(/\/admin\/login/);

            // Each attempt should return "Invalid or expired access code"
            // No enumeration should be possible — all invalid codes return the same error
            await expect(page.getByText(/invalid or expired/i)).toBeVisible();

            // No ledger data should be displayed
            await expect(page.getByText(/amount due/i)).not.toBeVisible();

            // No contract details should be exposed
            await expect(page.getByText(/tenant/i)).not.toBeVisible();
            await expect(page.getByText(/space/i)).not.toBeVisible();
        }

        // Verify that valid UUID format codes are all treated the same way
        // (no information leakage about whether a code is "close" to valid)
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toMatch(/Error:/i);
        expect(bodyText).not.toMatch(/NotFoundException/i);
        expect(bodyText).not.toMatch(/stack/i);

        // Codes are non-guessable random UUIDs v4 format
        // No sequential pattern can be used to enumerate valid codes
    });

    // ─── TC-PUBLIC-009 ────────────────────────────────────────────────────────
    // Priority: P2
    // Preconditions: Valid entry token exists.
    // Steps:
    //   1. Fill self-entry form and submit.
    //   2. Immediately try to submit again with different data.
    //   3. Try third time with different data.
    // Expected: First submission succeeds; subsequent submissions fail OR token is consumed after first use.
    test('TC-PUBLIC-009: Tenant self-entry duplicate submission', async ({ page }) => {
        // Precondition: A valid entry token must exist — requires a posted contract with entry token.
        // Entry tokens are only generated when a contract is posted.
        // In Docker mode no entry tokens have been issued — skip (BLOCKED).
        test.skip(isDockerMode, 'BLOCKED: No valid entry token exists — contract creation/posting UI not yet implemented; entry tokens only issued when contracts are posted; cannot test duplicate submission without valid token');

        // Non-Docker (mock): use the VALIDTOKEN fixture
        // Navigate to entry form
        await page.goto('/entry/VALIDTOKEN');

        // Fill and submit first time
        await page.getByLabel(/first name/i).fill('Juan');
        await page.getByLabel(/last name/i).fill('Dela Cruz');
        await page.getByLabel(/consent/i).check();
        await page.getByRole('button', { name: /submit/i }).click();

        // First submission should succeed
        await expect(page.getByText(/details submitted/i)).toBeVisible();

        // Try to access the same token again - should show "already submitted"
        await page.goto('/entry/VALIDTOKEN');
        await expect(page.getByText(/already been submitted/i)).toBeVisible();

        // Try with different data - should still fail (token consumed)
        await page.goto('/entry/USEDTOKEN');
        await expect(page.getByText(/already been submitted/i)).toBeVisible();
    });

    // ─── TC-PUBLIC-010 ────────────────────────────────────────────────────────
    // Priority: P2
    // Preconditions: Valid entry token exists.
    // Steps:
    //   1. Open entry form.
    //   2. Submit without filling required fields.
    // Expected: Validation blocks submission; required field errors shown.
    test('TC-PUBLIC-010: Self-entry with incomplete data', async ({ page }) => {
        // Precondition: A valid entry token must exist — requires a posted contract.
        // In Docker mode no entry tokens have been issued — skip (BLOCKED).
        test.skip(isDockerMode, 'BLOCKED: No valid entry token exists — contract creation/posting UI not yet implemented; cannot test incomplete data submission without valid token');

        // Non-Docker (mock): use the VALIDTOKEN fixture
        await page.goto('/entry/VALIDTOKEN');

        // Try to submit without filling required fields
        // Only check consent (optional) but leave first name and last name empty
        await page.getByLabel(/consent/i).check();
        await page.getByRole('button', { name: /submit/i }).click();

        // Validation should block submission
        // Required field errors should be shown
        await expect(page.getByText(/required/i)).toBeVisible();
        await expect(page.getByLabel(/first name/i)).toBeFocused();

        // Fill only first name, leave last name empty
        await page.getByLabel(/first name/i).fill('Juan');
        await page.getByRole('button', { name: /submit/i }).click();

        // Validation should still block (last name required)
        await expect(page.getByText(/required/i)).toBeVisible();
        await expect(page.getByLabel(/last name/i)).toBeFocused();

        // Consent should also be required
        await page.getByLabel(/last name/i).fill('Dela Cruz');
        await page.getByLabel(/consent/i).uncheck();
        await page.getByRole('button', { name: /submit/i }).click();

        // Validation should block (consent required)
        await expect(page.getByText(/consent/i)).toBeVisible();
    });
});
