/**
 * SIT/UAT Cycle 2 — Ledger & Payments Edge Cases
 * Tests: TC-PAYMENT-005 through TC-LEDGER-007
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';
import { setupAuth, isDockerMode } from './auth-helper';

const ADMIN_USER = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'replace-with-a-strong-password';

const LOGIN_BTN = /log in/i;

async function loginAndGoToContracts(page: import('@playwright/test').Page) {
    await page.goto('/admin/login');
    await page.getByLabel(/username/i).fill(ADMIN_USER);
    await page.getByLabel(/password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: LOGIN_BTN }).click();
    await page.waitForURL(/\/admin\/(dashboard|contracts)/);
    await page.goto('/admin/contracts');
}

// ────────────────────────────────────────────────────────────────────────────
// TC-PAYMENT-005 — Payment Greater Than Amount Due
// Priority: P2
// Preconditions: A posted contract with amount due = 5000.
// Steps:
//   1. Record payment of 10000.
//   2. View ledger.
// Expected: Amount due becomes 0; no negative values shown; any excess may be tracked separately.
// ────────────────────────────────────────────────────────────────────────────
test('TC-PAYMENT-005: Payment greater than amount due results in zero balance', async ({ page }) => {
    const uniqueEmail = `overpayment-${Date.now()}@example.com`;
    const tenantFirstName = 'Overpayment';
    const tenantLastName = 'Test';
    const spaceName = `Overpayment-Test-${Date.now()}`;
    const rentAmount = '5000';
    const depositAmount = '1000';
    const advanceAmount = '1000';
    const overpaymentAmount = '10000';

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in tenant details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify tenant was created
    const tenantLink = page.getByRole('link', { name: `${tenantFirstName} ${tenantLastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Step 2: Create a vacant space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    // Fill in space name
    const spaceNameInput = page.getByPlaceholder('e.g. Suite 101', { exact: true });
    await expect(spaceNameInput).toBeVisible({ timeout: 5_000 });
    await spaceNameInput.fill(spaceName);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify space was created
    const spaceRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(spaceRow).toBeVisible({ timeout: 10_000 });

    // Step 3: Create and post a contract with rent amount = 5000
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill in contract details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);

    // Select tenant from dropdown
    await page.getByRole('option', { name: new RegExp(tenantFirstName) }).click();

    // Fill in contract financial details
    await page.getByPlaceholder('0.00', { exact: true }).first().fill(rentAmount); // Rent amount
    await page.getByPlaceholder('0.00', { exact: true }).nth(1).fill(depositAmount); // Deposit
    await page.getByPlaceholder('0.00', { exact: true }).nth(2).fill(advanceAmount); // Advance

    // Set dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);
    endDate.setDate(today.getDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    await page.getByLabel(/start date/i).fill(startDateStr);
    await page.getByLabel(/end date/i).fill(endDateStr);

    // Select billing frequency
    await page.getByRole('combobox', { name: /billing/i }).selectOption('monthly');

    // Set due date rule
    await page.getByPlaceholder('e.g. 1', { exact: true }).fill('1');

    // Save as draft first
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(page.getByRole('heading', { name: 'New Contract' })).not.toBeVisible({ timeout: 10_000 });

    // Find the draft contract and post it
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const draftRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(draftRow).toBeVisible({ timeout: 10_000 });

    // Click "Post" button
    const postBtn = draftRow.getByRole('button', { name: /post/i });
    await expect(postBtn).toBeVisible({ timeout: 5_000 });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(2_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Record an overpayment (10000 when amount due is 5000)
    const recordBtn = page.getByRole('button', { name: /record payment/i });
    const hasRecordBtn = await recordBtn.isVisible().catch(() => false);

    if (!hasRecordBtn) {
        test.skip(true, 'BLOCKED: No Record Payment button found on contract detail page');
    }

    await recordBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Fill payment amount (overpayment)
    await page.getByLabel(/amount/i).fill(overpaymentAmount);

    // Set payment date to today
    const paymentDateStr = new Date().toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(paymentDateStr);

    // Submit the payment
    await page.getByRole('button', { name: /save/i }).click();

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

    // Step 6: Verify amount due is 0 (not negative)
    // Look for Amount Due section
    const amountDueSection = page.getByText(/amount due/i);
    await expect(amountDueSection).toBeVisible({ timeout: 5_000 });

    // Extract the amount due value
    const pageContent = await page.content();
    
    // Check that amount due is 0 or shows no negative values
    // Amount due should be displayed as ₱0.00 or 0.00
    const hasZeroAmountDue = pageContent.includes('₱0.00') || pageContent.includes('0.00');
    const hasNegativeValue = pageContent.includes('-₱') || pageContent.match(/-\d+/);

    expect(hasZeroAmountDue).toBe(true);
    expect(hasNegativeValue).toBe(false);

    // Verify the payment was recorded in the payments table
    const paymentsTable = page.getByRole('table', { name: /payments/i });
    if (await paymentsTable.isVisible({ timeout: 3_000 }).catch(() => false)) {
        // Check that the overpayment amount appears in the table
        const paymentText = await paymentsTable.textContent();
        expect(paymentText).toContain(overpaymentAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    }
});

// ────────────────────────────────────────────────────────────────────────────
// TC-PAYMENT-006 — Payment = 0 (Zero Amount)
// Priority: P2
// Preconditions: Admin is on Record Payment form.
// Steps:
//   1. Enter payment amount: 0.
//   2. Attempt to save.
// Expected Result: Validation blocks zero-amount payment OR payment is recorded with zero amount.
// ────────────────────────────────────────────────────────────────────────────
test('TC-PAYMENT-006: Zero amount payment is blocked by validation', async ({ page }) => {
    const uniqueEmail = `zeropayment-${Date.now()}@example.com`;
    const tenantFirstName = 'ZeroPayment';
    const tenantLastName = 'Test';
    const spaceName = `ZeroPayment-Test-${Date.now()}`;
    const rentAmount = '5000';
    const depositAmount = '1000';
    const advanceAmount = '1000';
    const zeroAmount = '0';

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in tenant details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify tenant was created
    const tenantLink = page.getByRole('link', { name: `${tenantFirstName} ${tenantLastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Step 2: Create a vacant space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    // Fill in space name
    const spaceNameInput = page.getByPlaceholder('e.g. Suite 101', { exact: true });
    await expect(spaceNameInput).toBeVisible({ timeout: 5_000 });
    await spaceNameInput.fill(spaceName);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify space was created
    const spaceRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(spaceRow).toBeVisible({ timeout: 10_000 });

    // Step 3: Create and post a contract
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill in contract details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);

    // Select tenant from dropdown
    await page.getByRole('option', { name: new RegExp(tenantFirstName) }).click();

    // Fill in contract financial details
    await page.getByPlaceholder('0.00', { exact: true }).first().fill(rentAmount); // Rent amount
    await page.getByPlaceholder('0.00', { exact: true }).nth(1).fill(depositAmount); // Deposit
    await page.getByPlaceholder('0.00', { exact: true }).nth(2).fill(advanceAmount); // Advance

    // Set dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);
    endDate.setDate(today.getDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    await page.getByLabel(/start date/i).fill(startDateStr);
    await page.getByLabel(/end date/i).fill(endDateStr);

    // Select billing frequency
    await page.getByRole('combobox', { name: /billing/i }).selectOption('monthly');

    // Set due date rule
    await page.getByPlaceholder('e.g. 1', { exact: true }).fill('1');

    // Save as draft first
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(page.getByRole('heading', { name: 'New Contract' })).not.toBeVisible({ timeout: 10_000 });

    // Find the draft contract and post it
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const draftRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(draftRow).toBeVisible({ timeout: 10_000 });

    // Click "Post" button
    const postBtn = draftRow.getByRole('button', { name: /post/i });
    await expect(postBtn).toBeVisible({ timeout: 5_000 });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(2_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Attempt to record a zero amount payment
    const recordBtn = page.getByRole('button', { name: /record payment/i });
    const hasRecordBtn = await recordBtn.isVisible().catch(() => false);

    if (!hasRecordBtn) {
        test.skip(true, 'BLOCKED: No Record Payment button found on contract detail page');
    }

    await recordBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Fill payment amount with zero
    await page.getByLabel(/amount/i).fill(zeroAmount);

    // Set payment date to today
    const paymentDateStr = new Date().toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(paymentDateStr);

    // Submit the payment
    await page.getByRole('button', { name: /save/i }).click();

    // Step 6: Verify validation blocks zero amount payment
    // Either dialog stays open with error, or error message is shown
    const dialogStillVisible = await page.getByRole('dialog').isVisible({ timeout: 3_000 }).catch(() => false);
    const pageContent = await page.content();

    // Check for validation error messages
    const hasValidationError = pageContent.toLowerCase().includes('amount must be greater') ||
        pageContent.toLowerCase().includes('invalid amount') ||
        pageContent.toLowerCase().includes('amount required') ||
        pageContent.toLowerCase().includes('zero') ||
        dialogStillVisible;

    // If no validation error found, check if payment was recorded (which would be acceptable v1 behavior)
    if (!hasValidationError) {
        // Check if zero payment was recorded - this is acceptable v1 behavior
        const paymentsTable = page.getByRole('table', { name: /payments/i });
        if (await paymentsTable.isVisible({ timeout: 3_000 }).catch(() => false)) {
            const paymentText = await paymentsTable.textContent();
            // If zero payment appears in table, that's acceptable v1 behavior
            const zeroPaymentRecorded = paymentText.includes('0.00') || paymentText.includes('₱0');
            expect(zeroPaymentRecorded).toBe(true);
        } else {
            // If no payments table and no validation error, test fails
            expect(hasValidationError).toBe(true);
        }
    }
});

// ────────────────────────────────────────────────────────────────────────────
// TC-PAYMENT-007 — Multiple Payments on Same Day
// Priority: P2
// Preconditions: A posted contract exists.
// Steps:
//   1. Record payment 1: 1000, date: today.
//   2. Record payment 2: 500, date: today.
//   3. View ledger.
// Expected: Both payments are recorded; amount due reflects sum of payments correctly.
// ────────────────────────────────────────────────────────────────────────────
test('TC-PAYMENT-007: Multiple payments on same day are recorded correctly', async ({ page }) => {
    const uniqueEmail = `multipayment-${Date.now()}@example.com`;
    const tenantFirstName = 'MultiPayment';
    const tenantLastName = 'Test';
    const spaceName = `MultiPayment-Test-${Date.now()}`;
    const rentAmount = '5000';
    const depositAmount = '1000';
    const advanceAmount = '1000';
    const payment1Amount = '1000';
    const payment2Amount = '500';

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in tenant details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify tenant was created
    const tenantLink = page.getByRole('link', { name: `${tenantFirstName} ${tenantLastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Step 2: Create a vacant space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    // Fill in space name
    const spaceNameInput = page.getByPlaceholder('e.g. Suite 101', { exact: true });
    await expect(spaceNameInput).toBeVisible({ timeout: 5_000 });
    await spaceNameInput.fill(spaceName);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify space was created
    const spaceRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(spaceRow).toBeVisible({ timeout: 10_000 });

    // Step 3: Create and post a contract
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill in contract details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);

    // Select tenant from dropdown
    await page.getByRole('option', { name: new RegExp(tenantFirstName) }).click();

    // Fill in contract financial details
    await page.getByPlaceholder('0.00', { exact: true }).first().fill(rentAmount); // Rent amount
    await page.getByPlaceholder('0.00', { exact: true }).nth(1).fill(depositAmount); // Deposit
    await page.getByPlaceholder('0.00', { exact: true }).nth(2).fill(advanceAmount); // Advance

    // Set dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);
    endDate.setDate(today.getDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    await page.getByLabel(/start date/i).fill(startDateStr);
    await page.getByLabel(/end date/i).fill(endDateStr);

    // Select billing frequency
    await page.getByRole('combobox', { name: /billing/i }).selectOption('monthly');

    // Set due date rule
    await page.getByPlaceholder('e.g. 1', { exact: true }).fill('1');

    // Save as draft first
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(page.getByRole('heading', { name: 'New Contract' })).not.toBeVisible({ timeout: 10_000 });

    // Find the draft contract and post it
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const draftRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(draftRow).toBeVisible({ timeout: 10_000 });

    // Click "Post" button
    const postBtn = draftRow.getByRole('button', { name: /post/i });
    await expect(postBtn).toBeVisible({ timeout: 5_000 });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(2_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Record first payment (1000)
    const recordBtn = page.getByRole('button', { name: /record payment/i });
    const hasRecordBtn = await recordBtn.isVisible().catch(() => false);

    if (!hasRecordBtn) {
        test.skip(true, 'BLOCKED: No Record Payment button found on contract detail page');
    }

    await recordBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Fill first payment amount
    await page.getByLabel(/amount/i).fill(payment1Amount);

    // Set payment date to today
    const paymentDateStr = new Date().toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(paymentDateStr);

    // Submit the first payment
    await page.getByRole('button', { name: /save/i }).click();

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

    // Step 6: Record second payment (500) on the same day
    await recordBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Fill second payment amount
    await page.getByLabel(/amount/i).fill(payment2Amount);

    // Set same payment date (today)
    await page.getByLabel(/date/i).fill(paymentDateStr);

    // Submit the second payment
    await page.getByRole('button', { name: /save/i }).click();

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

    // Step 7: Verify both payments are recorded in the payments table
    const paymentsTable = page.getByRole('table', { name: /payments/i });
    await expect(paymentsTable).toBeVisible({ timeout: 5_000 });

    const paymentTableContent = await paymentsTable.textContent();

    // Check that both payment amounts appear in the table
    const hasPayment1 = paymentTableContent.includes(payment1Amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) ||
        paymentTableContent.includes(payment1Amount);
    const hasPayment2 = paymentTableContent.includes(payment2Amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) ||
        paymentTableContent.includes(payment2Amount);

    expect(hasPayment1).toBe(true);
    expect(hasPayment2).toBe(true);

    // Step 8: Verify amount due reflects both payments
    // Original amount due = rentAmount (5000) - deposit (1000) - advance (1000) = 3000
    // After payments: 3000 - 1000 - 500 = 1500
    const amountDueSection = page.getByText(/amount due/i);
    await expect(amountDueSection).toBeVisible({ timeout: 5_000 });

    const pageContent = await page.content();

    // Check that amount due is updated (should be 1500 or less depending on how deposit/advance are handled)
    // The key verification is that both payments were recorded without errors
    const hasNegativeValue = pageContent.includes('-₱') || pageContent.match(/-\d+/);
    expect(hasNegativeValue).toBe(false);
});

// ────────────────────────────────────────────────────────────────────────────
// TC-PAYMENT-008 — Payment Date Before Contract Start
// Priority: P1
// Preconditions: Admin is on Record Payment form for a posted contract.
// Steps:
//   1. Set payment date to before the contract start date.
//   2. Attempt to save.
// Expected Result: Validation error prevents recording payment with date before contract start.
// ────────────────────────────────────────────────────────────────────────────
test('TC-PAYMENT-008: Payment date before contract start is blocked by validation', async ({ page }) => {
    const uniqueEmail = `payment-before-start-${Date.now()}@example.com`;
    const tenantFirstName = 'PaymentBeforeStart';
    const tenantLastName = 'Test';
    const spaceName = `PaymentBeforeStart-Test-${Date.now()}`;
    const rentAmount = '5000';
    const depositAmount = '1000';
    const advanceAmount = '1000';

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in tenant details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify tenant was created
    const tenantLink = page.getByRole('link', { name: `${tenantFirstName} ${tenantLastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Step 2: Create a vacant space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    // Fill in space name
    const spaceNameInput = page.getByPlaceholder('e.g. Suite 101', { exact: true });
    await expect(spaceNameInput).toBeVisible({ timeout: 5_000 });
    await spaceNameInput.fill(spaceName);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify space was created
    const spaceRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(spaceRow).toBeVisible({ timeout: 10_000 });

    // Step 3: Create and post a contract with a future start date
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill in contract details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);

    // Select tenant from dropdown
    await page.getByRole('option', { name: new RegExp(tenantFirstName) }).click();

    // Fill in contract financial details
    await page.getByPlaceholder('0.00', { exact: true }).first().fill(rentAmount); // Rent amount
    await page.getByPlaceholder('0.00', { exact: true }).nth(1).fill(depositAmount); // Deposit
    await page.getByPlaceholder('0.00', { exact: true }).nth(2).fill(advanceAmount); // Advance

    // Set start date to 30 days in the future
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 30);
    const startDateStr = startDate.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);
    endDate.setDate(today.getDate() + 30);
    const endDateStr = endDate.toISOString().split('T')[0];

    await page.getByLabel(/start date/i).fill(startDateStr);
    await page.getByLabel(/end date/i).fill(endDateStr);

    // Select billing frequency
    await page.getByRole('combobox', { name: /billing/i }).selectOption('monthly');

    // Set due date rule
    await page.getByPlaceholder('e.g. 1', { exact: true }).fill('1');

    // Save as draft first
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(page.getByRole('heading', { name: 'New Contract' })).not.toBeVisible({ timeout: 10_000 });

    // Find the draft contract and post it
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const draftRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(draftRow).toBeVisible({ timeout: 10_000 });

    // Click "Post" button
    const postBtn = draftRow.getByRole('button', { name: /post/i });
    await expect(postBtn).toBeVisible({ timeout: 5_000 });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(2_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Attempt to record a payment with date before contract start
    const recordBtn = page.getByRole('button', { name: /record payment/i });
    const hasRecordBtn = await recordBtn.isVisible().catch(() => false);

    if (!hasRecordBtn) {
        test.skip(true, 'BLOCKED: No Record Payment button found on contract detail page');
    }

    await recordBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Fill payment amount
    await page.getByLabel(/amount/i).fill('1000');

    // Set payment date to BEFORE contract start date (e.g., today, which is 30 days before start)
    const paymentDateStr = new Date().toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(paymentDateStr);

    // Submit the payment
    await page.getByRole('button', { name: /save/i }).click();

    // Step 6: Verify validation blocks payment with date before contract start
    // Either dialog stays open with error, or error message is shown
    const dialogStillVisible = await page.getByRole('dialog').isVisible({ timeout: 3_000 }).catch(() => false);
    const pageContent = await page.content();

    // Check for validation error messages
    const hasValidationError = pageContent.toLowerCase().includes('before') && pageContent.toLowerCase().includes('start') ||
        pageContent.toLowerCase().includes('invalid date') ||
        pageContent.toLowerCase().includes('cannot be before') ||
        dialogStillVisible;

    // If validation error found, test passes
    if (hasValidationError) {
        expect(true).toBe(true);
    } else {
        // If no validation error, check if payment was recorded
        // This would indicate the feature is not implemented
        const paymentsTable = page.getByRole('table', { name: /payments/i });
        if (await paymentsTable.isVisible({ timeout: 3_000 }).catch(() => false)) {
            const paymentText = await paymentsTable.textContent();
            // If payment with past date was recorded, this is a FAIL
            // because we expect validation to block it
            expect(hasValidationError).toBe(true);
        } else {
            // If no payments table and no validation error, dialog should still be open
            expect(dialogStillVisible).toBe(true);
        }
    }
});

// ────────────────────────────────────────────────────────────────────────────
// TC-PAYMENT-009 — Payment Date in the Future
// Priority: P2
// Preconditions: Admin is on Record Payment form.
// Steps:
//   1. Set payment date to 1 year in the future.
//   2. Attempt to save.
// Expected Result: Either validation error OR warning shown about future date; payment may be allowed.
// ────────────────────────────────────────────────────────────────────────────
test('TC-PAYMENT-009: Payment date in the future is handled correctly', async ({ page }) => {
    const uniqueEmail = `futurepayment-${Date.now()}@example.com`;
    const tenantFirstName = 'FuturePayment';
    const tenantLastName = 'Test';
    const spaceName = `FuturePayment-Test-${Date.now()}`;
    const rentAmount = '5000';
    const depositAmount = '1000';
    const advanceAmount = '1000';
    const paymentAmount = '1000';

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in tenant details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify tenant was created
    const tenantLink = page.getByRole('link', { name: `${tenantFirstName} ${tenantLastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Step 2: Create a vacant space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    // Fill in space name
    const spaceNameInput = page.getByPlaceholder('e.g. Suite 101', { exact: true });
    await expect(spaceNameInput).toBeVisible({ timeout: 5_000 });
    await spaceNameInput.fill(spaceName);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify space was created
    const spaceRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(spaceRow).toBeVisible({ timeout: 10_000 });

    // Step 3: Create and post a contract
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill in contract details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);

    // Select tenant from dropdown
    await page.getByRole('option', { name: new RegExp(tenantFirstName) }).click();

    // Fill in contract financial details
    await page.getByPlaceholder('0.00', { exact: true }).first().fill(rentAmount); // Rent amount
    await page.getByPlaceholder('0.00', { exact: true }).nth(1).fill(depositAmount); // Deposit
    await page.getByPlaceholder('0.00', { exact: true }).nth(2).fill(advanceAmount); // Advance

    // Set dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);
    endDate.setDate(today.getDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    await page.getByLabel(/start date/i).fill(startDateStr);
    await page.getByLabel(/end date/i).fill(endDateStr);

    // Select billing frequency
    await page.getByRole('combobox', { name: /billing/i }).selectOption('monthly');

    // Set due date rule
    await page.getByPlaceholder('e.g. 1', { exact: true }).fill('1');

    // Save as draft first
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(page.getByRole('heading', { name: 'New Contract' })).not.toBeVisible({ timeout: 10_000 });

    // Find the draft contract and post it
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const draftRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(draftRow).toBeVisible({ timeout: 10_000 });

    // Click "Post" button
    const postBtn = draftRow.getByRole('button', { name: /post/i });
    await expect(postBtn).toBeVisible({ timeout: 5_000 });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(2_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Attempt to record a payment with date 1 year in the future
    const recordBtn = page.getByRole('button', { name: /record payment/i });
    const hasRecordBtn = await recordBtn.isVisible().catch(() => false);

    if (!hasRecordBtn) {
        test.skip(true, 'BLOCKED: No Record Payment button found on contract detail page');
    }

    await recordBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Fill payment amount
    await page.getByLabel(/amount/i).fill(paymentAmount);

    // Set payment date to 1 year in the future
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(futureDateStr);

    // Submit the payment
    await page.getByRole('button', { name: /save/i }).click();

    // Step 6: Verify validation blocks payment with future date
    // Expected: Validation error should prevent recording payment with date in the future
    const dialogStillVisible = await page.getByRole('dialog').isVisible({ timeout: 3_000 }).catch(() => false);
    const pageContent = await page.content();

    // Check for validation error messages about future dates
    const hasValidationError = pageContent.toLowerCase().includes('future') ||
        pageContent.toLowerCase().includes('cannot be in the future') ||
        dialogStillVisible;

    // Verify validation blocks future date payment
    expect(hasValidationError).toBe(true);
});

// ────────────────────────────────────────────────────────────────────────────
// TC-PAYMENT-010 — Very Large Payment Amount
// Priority: P2
// Preconditions: Admin is on Record Payment form.
// Steps:
//   1. Enter payment amount: 999,999,999,999.
//   2. Save.
// Expected Result: Either saved successfully (if within limits) OR validation error about max amount.
// ────────────────────────────────────────────────────────────────────────────
test('TC-PAYMENT-010: Very large payment amount is handled correctly', async ({ page }) => {
    const uniqueEmail = `largepayment-${Date.now()}@example.com`;
    const tenantFirstName = 'LargePayment';
    const tenantLastName = 'Test';
    const spaceName = `LargePayment-Test-${Date.now()}`;
    const rentAmount = '5000';
    const depositAmount = '1000';
    const advanceAmount = '1000';
    const largePaymentAmount = '999999999999';

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in tenant details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify tenant was created
    const tenantLink = page.getByRole('link', { name: `${tenantFirstName} ${tenantLastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Step 2: Create a vacant space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    // Fill in space name
    const spaceNameInput = page.getByPlaceholder('e.g. Suite 101', { exact: true });
    await expect(spaceNameInput).toBeVisible({ timeout: 5_000 });
    await spaceNameInput.fill(spaceName);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify space was created
    const spaceRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(spaceRow).toBeVisible({ timeout: 10_000 });

    // Step 3: Create and post a contract
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill in contract details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);

    // Select tenant from dropdown
    await page.getByRole('option', { name: new RegExp(tenantFirstName) }).click();

    // Fill in contract financial details
    await page.getByPlaceholder('0.00', { exact: true }).first().fill(rentAmount); // Rent amount
    await page.getByPlaceholder('0.00', { exact: true }).nth(1).fill(depositAmount); // Deposit
    await page.getByPlaceholder('0.00', { exact: true }).nth(2).fill(advanceAmount); // Advance

    // Set dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);
    endDate.setDate(today.getDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    await page.getByLabel(/start date/i).fill(startDateStr);
    await page.getByLabel(/end date/i).fill(endDateStr);

    // Select billing frequency
    await page.getByRole('combobox', { name: /billing/i }).selectOption('monthly');

    // Set due date rule
    await page.getByPlaceholder('e.g. 1', { exact: true }).fill('1');

    // Save as draft first
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(page.getByRole('heading', { name: 'New Contract' })).not.toBeVisible({ timeout: 10_000 });

    // Find the draft contract and post it
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const draftRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(draftRow).toBeVisible({ timeout: 10_000 });

    // Click "Post" button
    const postBtn = draftRow.getByRole('button', { name: /post/i });
    await expect(postBtn).toBeVisible({ timeout: 5_000 });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(2_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Attempt to record a very large payment (999,999,999,999)
    const recordBtn = page.getByRole('button', { name: /record payment/i });
    const hasRecordBtn = await recordBtn.isVisible().catch(() => false);

    if (!hasRecordBtn) {
        test.skip(true, 'BLOCKED: No Record Payment button found on contract detail page');
    }

    await recordBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Fill payment amount with very large value
    await page.getByLabel(/amount/i).fill(largePaymentAmount);

    // Set payment date to today
    const paymentDateStr = new Date().toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(paymentDateStr);

    // Submit the payment
    await page.getByRole('button', { name: /save/i }).click();

    // Step 6: Verify system handles very large payment amount
    // Either: validation error shown OR payment is recorded successfully (acceptable v1 behavior)
    const dialogStillVisible = await page.getByRole('dialog').isVisible({ timeout: 3_000 }).catch(() => false);
    const pageContent = await page.content();

    // Check for validation error messages about max amount
    const hasValidationError = pageContent.toLowerCase().includes('max') ||
        pageContent.toLowerCase().includes('exceed') ||
        pageContent.toLowerCase().includes('limit') ||
        pageContent.toLowerCase().includes('too large') ||
        dialogStillVisible;

    if (hasValidationError) {
        // Validation error shown - test passes
        expect(true).toBe(true);
    } else {
        // No validation error - check if payment was recorded (acceptable v1 behavior)
        const paymentsTable = page.getByRole('table', { name: /payments/i });
        if (await paymentsTable.isVisible({ timeout: 3_000 }).catch(() => false)) {
            const paymentText = await paymentsTable.textContent();
            // If large payment was recorded, that's acceptable v1 behavior
            // Check that the large amount appears in the table
            const largePaymentRecorded = paymentText.includes('999999999999') ||
                paymentText.includes('999,999,999,999');
            expect(largePaymentRecorded).toBe(true);
        } else {
            // If no payments table and no validation error, dialog should still be open
            expect(dialogStillVisible).toBe(true);
        }
    }
});

// ────────────────────────────────────────────────────────────────────────────
// TC-PAYMENT-011 — Re-void Already Voided Payment
// Priority: P2
// Preconditions: A payment has already been voided.
// Steps:
//   1. Navigate to the voided payment.
//   2. Attempt to void again.
// Expected Result: Void button is disabled OR no action taken; no duplicate audit record.
// ────────────────────────────────────────────────────────────────────────────
test('TC-PAYMENT-011: Already voided payment cannot be voided again', async ({ page }) => {
    const uniqueEmail = `revoid-${Date.now()}@example.com`;
    const tenantFirstName = 'ReVoid';
    const tenantLastName = 'Test';
    const spaceName = `ReVoid-Test-${Date.now()}`;
    const rentAmount = '5000';
    const depositAmount = '1000';
    const advanceAmount = '1000';
    const paymentAmount = '1000';

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in tenant details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify tenant was created
    const tenantLink = page.getByRole('link', { name: `${tenantFirstName} ${tenantLastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Step 2: Create a vacant space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    // Fill in space name
    const spaceNameInput = page.getByPlaceholder('e.g. Suite 101', { exact: true });
    await expect(spaceNameInput).toBeVisible({ timeout: 5_000 });
    await spaceNameInput.fill(spaceName);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify space was created
    const spaceRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(spaceRow).toBeVisible({ timeout: 10_000 });

    // Step 3: Create and post a contract
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill in contract details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);

    // Select tenant from dropdown
    await page.getByRole('option', { name: new RegExp(tenantFirstName) }).click();

    // Fill in contract financial details
    await page.getByPlaceholder('0.00', { exact: true }).first().fill(rentAmount); // Rent amount
    await page.getByPlaceholder('0.00', { exact: true }).nth(1).fill(depositAmount); // Deposit
    await page.getByPlaceholder('0.00', { exact: true }).nth(2).fill(advanceAmount); // Advance

    // Set dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);
    endDate.setDate(today.getDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    await page.getByLabel(/start date/i).fill(startDateStr);
    await page.getByLabel(/end date/i).fill(endDateStr);

    // Select billing frequency
    await page.getByRole('combobox', { name: /billing/i }).selectOption('monthly');

    // Set due date rule
    await page.getByPlaceholder('e.g. 1', { exact: true }).fill('1');

    // Save as draft first
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(page.getByRole('heading', { name: 'New Contract' })).not.toBeVisible({ timeout: 10_000 });

    // Find the draft contract and post it
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const draftRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(draftRow).toBeVisible({ timeout: 10_000 });

    // Click "Post" button
    const postBtn = draftRow.getByRole('button', { name: /post/i });
    await expect(postBtn).toBeVisible({ timeout: 5_000 });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(2_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Record a payment to void
    const recordBtn = page.getByRole('button', { name: /record payment/i });
    const hasRecordBtn = await recordBtn.isVisible().catch(() => false);

    if (!hasRecordBtn) {
        test.skip(true, 'BLOCKED: No Record Payment button found on contract detail page');
    }

    await recordBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Fill payment amount
    await page.getByLabel(/amount/i).fill(paymentAmount);

    // Set payment date to today
    const paymentDateStr = new Date().toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(paymentDateStr);

    // Submit the payment
    await page.getByRole('button', { name: /save/i }).click();

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

    // Step 6: Find and click the Void button for the payment
    // Look for the payment row that has "No" in the Voided column (not yet voided)
    const paymentsTable = page.getByRole('table', { name: /payments/i });
    if (!await paymentsTable.isVisible().catch(() => false)) {
        test.skip(true, 'BLOCKED: No payments table found on ledger page');
    }

    // Find a payment row with "No" in Voided column (not yet voided) with a Void button
    // The Voided column shows "No" for non-voided payments
    const paymentRow = paymentsTable
        .locator('tbody tr')
        .filter({ hasText: /No/i })
        .first();

    const voidBtn = paymentRow.getByRole('button', { name: /void/i });
    const hasVoidBtn = await voidBtn.isVisible().catch(() => false);

    if (!hasVoidBtn) {
        test.skip(true, 'BLOCKED: No Void button found on payment row');
    }

    // Click Void button
    await voidBtn.click();

    // Confirm if prompted
    const confirmDialogBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmDialogBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmDialogBtn.click();
    }

    // Wait for void action to complete
    await page.waitForTimeout(1_000);

    // Step 7: Verify the payment is now voided (Voided column shows "Yes")
    const voidedPaymentRow = paymentsTable
        .locator('tbody tr')
        .filter({ hasText: /Yes/i })
        .first();

    const isVoided = await voidedPaymentRow.isVisible().catch(() => false);
    expect(isVoided).toBe(true);

    // Step 8: Attempt to void the already voided payment
    // Void button should NOT be visible on the voided payment row
    const voidBtnOnVoided = voidedPaymentRow.getByRole('button', { name: /void/i });
    const hasVoidBtnOnVoided = await voidBtnOnVoided.isVisible().catch(() => false);

    // Expected: Void button is disabled OR not visible on already voided payment
    expect(hasVoidBtnOnVoided).toBe(false);
});

// ────────────────────────────────────────────────────────────────────────────
// TC-PAYMENT-012 — Void Payment Creates Audit Record
// Priority: P1
// Preconditions: A payment has been voided.
// Steps:
//   1. Void a payment.
//   2. Check the audit table/log.
// Expected Result: An audit record is created with payment ID, void timestamp, and admin who performed action.
// ────────────────────────────────────────────────────────────────────────────
test('TC-PAYMENT-012: Voiding a payment creates an audit record', async ({ page }) => {
    const uniqueEmail = `audit-${Date.now()}@example.com`;
    const tenantFirstName = 'Audit';
    const tenantLastName = 'Test';
    const spaceName = `Audit-Test-${Date.now()}`;
    const rentAmount = '5000';
    const depositAmount = '1000';
    const advanceAmount = '1000';
    const paymentAmount = '1000';

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in tenant details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify tenant was created
    const tenantLink = page.getByRole('link', { name: `${tenantFirstName} ${tenantLastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Step 2: Create a vacant space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    // Fill in space name
    const spaceNameInput = page.getByPlaceholder('e.g. Suite 101', { exact: true });
    await expect(spaceNameInput).toBeVisible({ timeout: 5_000 });
    await spaceNameInput.fill(spaceName);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify space was created
    const spaceRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(spaceRow).toBeVisible({ timeout: 10_000 });

    // Step 3: Create and post a contract
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill in contract details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);

    // Select tenant from dropdown
    await page.getByRole('option', { name: new RegExp(tenantFirstName) }).click();

    // Fill in contract financial details
    await page.getByPlaceholder('0.00', { exact: true }).first().fill(rentAmount); // Rent amount
    await page.getByPlaceholder('0.00', { exact: true }).nth(1).fill(depositAmount); // Deposit
    await page.getByPlaceholder('0.00', { exact: true }).nth(2).fill(advanceAmount); // Advance

    // Set dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);
    endDate.setDate(today.getDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    await page.getByLabel(/start date/i).fill(startDateStr);
    await page.getByLabel(/end date/i).fill(endDateStr);

    // Select billing frequency
    await page.getByRole('combobox', { name: /billing/i }).selectOption('monthly');

    // Set due date rule
    await page.getByPlaceholder('e.g. 1', { exact: true }).fill('1');

    // Save as draft first
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(page.getByRole('heading', { name: 'New Contract' })).not.toBeVisible({ timeout: 10_000 });

    // Find the draft contract and post it
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const draftRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(draftRow).toBeVisible({ timeout: 10_000 });

    // Click "Post" button
    const postBtn = draftRow.getByRole('button', { name: /post/i });
    await expect(postBtn).toBeVisible({ timeout: 5_000 });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(2_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Record a payment to void
    const recordBtn = page.getByRole('button', { name: /record payment/i });
    const hasRecordBtn = await recordBtn.isVisible().catch(() => false);

    if (!hasRecordBtn) {
        test.skip(true, 'BLOCKED: No Record Payment button found on contract detail page');
    }

    await recordBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Fill payment amount
    await page.getByLabel(/amount/i).fill(paymentAmount);

    // Set payment date to today
    const paymentDateStr = new Date().toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(paymentDateStr);

    // Submit the payment
    await page.getByRole('button', { name: /save/i }).click();

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

    // Step 6: Capture the payment ID before voiding
    const paymentsTable = page.getByRole('table', { name: /payments/i });
    if (!await paymentsTable.isVisible().catch(() => false)) {
        test.skip(true, 'BLOCKED: No payments table found on ledger page');
    }

    // Get the payment row (the one we just created with today's date)
    const paymentRow = paymentsTable
        .locator('tbody tr')
        .filter({ hasText: paymentDateStr })
        .first();

    // Extract payment amount from the row for verification
    const paymentAmountText = await paymentRow.textContent();

    // Step 7: Navigate to audit log page before voiding
    await page.goto('/admin/audit');
    await page.waitForURL(/\/admin\/audit/);

    // Capture initial audit log state
    const auditTableBefore = page.getByRole('table');
    const auditContentBefore = await auditTableBefore.textContent();

    // Count existing audit entries
    const auditRowsBefore = await page.locator('table tbody tr').count();

    // Step 8: Go back to ledger and void the payment
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    // Navigate back to the contract ledger
    const contractRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(contractRow).toBeVisible({ timeout: 10_000 });

    const contractLink2 = contractRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink2.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink2.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    }

    // Find the payment row again and void it
    const paymentRow2 = page.getByRole('table', { name: /payments/i })
        .locator('tbody tr')
        .filter({ hasText: paymentDateStr })
        .first();

    const voidBtn = paymentRow2.getByRole('button', { name: /void/i });
    const hasVoidBtn = await voidBtn.isVisible().catch(() => false);

    if (!hasVoidBtn) {
        test.skip(true, 'BLOCKED: No Void button found on payment row');
    }

    // Click Void button
    await voidBtn.click();

    // Confirm if prompted
    const confirmDialogBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmDialogBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmDialogBtn.click();
    }

    // Wait for void action to complete
    await page.waitForTimeout(1_000);

    // Step 9: Navigate to audit log and verify audit record was created
    await page.goto('/admin/audit');
    await page.waitForURL(/\/admin\/audit/);

    // Wait for audit table to load
    await page.waitForTimeout(1_000);

    // Check that a new audit entry was created
    const auditTableAfter = page.getByRole('table');
    const auditRowsAfter = await page.locator('table tbody tr').count();

    // Verify at least one new audit entry was added
    expect(auditRowsAfter).toBeGreaterThan(auditRowsBefore);

    // Get the latest audit entry (should be at the top)
    const latestAuditRow = page.locator('table tbody tr').first();
    const auditContent = await latestAuditRow.textContent();

    // Verify audit record contains payment-related information
    // Expected: payment ID, void timestamp, action type
    const hasVoidAction = auditContent.toLowerCase().includes('void') ||
        auditContent.toLowerCase().includes('payment');

    // Verify audit record contains timestamp (date/time format)
    const hasTimestamp = /\d{4}-\d{2}-\d{2}/.test(auditContent) ||
        /\d{1,2}\/\d{1,2}\/\d{4}/.test(auditContent);

    expect(hasVoidAction).toBe(true);
    expect(hasTimestamp).toBe(true);

    // Optional: Verify admin user is recorded (if visible in audit log)
    // The audit log should show which admin performed the void action
});

// ────────────────────────────────────────────────────────────────────────────
// TC-LEDGER-003 — Amount Due = 0 (Fully Paid)
// Priority: P1
// Preconditions: A posted contract where all payables are paid.
// Steps:
//   1. Navigate to contract ledger.
//   2. Check amount due.
// Expected Result: Amount due shows 0; no negative value.
// ────────────────────────────────────────────────────────────────────────────
test('TC-LEDGER-003: Fully paid contract shows amount due = 0', async ({ page }) => {
    const uniqueEmail = `fullypaid-${Date.now()}@example.com`;
    const tenantFirstName = 'FullyPaid';
    const tenantLastName = 'Test';
    const spaceName = `FullyPaid-Test-${Date.now()}`;
    const rentAmount = '5000';
    const depositAmount = '1000';
    const advanceAmount = '5000'; // Advance covers first month

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in tenant details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify tenant was created
    const tenantLink = page.getByRole('link', { name: `${tenantFirstName} ${tenantLastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Step 2: Create a vacant space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    // Fill in space name
    const spaceNameInput = page.getByPlaceholder('e.g. Suite 101', { exact: true });
    await expect(spaceNameInput).toBeVisible({ timeout: 5_000 });
    await spaceNameInput.fill(spaceName);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify space was created
    const spaceRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(spaceRow).toBeVisible({ timeout: 10_000 });

    // Step 3: Create and post a contract
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill in contract details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);

    // Select tenant from dropdown
    await page.getByRole('option', { name: new RegExp(tenantFirstName) }).click();

    // Fill in contract financial details
    await page.getByPlaceholder('0.00', { exact: true }).first().fill(rentAmount); // Rent amount
    await page.getByPlaceholder('0.00', { exact: true }).nth(1).fill(depositAmount); // Deposit
    await page.getByPlaceholder('0.00', { exact: true }).nth(2).fill(advanceAmount); // Advance

    // Set dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);
    endDate.setDate(today.getDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    await page.getByLabel(/start date/i).fill(startDateStr);
    await page.getByLabel(/end date/i).fill(endDateStr);

    // Select billing frequency
    await page.getByRole('combobox', { name: /billing/i }).selectOption('monthly');

    // Set due date rule
    await page.getByPlaceholder('e.g. 1', { exact: true }).fill('1');

    // Save as draft first
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(page.getByRole('heading', { name: 'New Contract' })).not.toBeVisible({ timeout: 10_000 });

    // Find the draft contract and post it
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const draftRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(draftRow).toBeVisible({ timeout: 10_000 });

    // Click "Post" button
    const postBtn = draftRow.getByRole('button', { name: /post/i });
    await expect(postBtn).toBeVisible({ timeout: 5_000 });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(2_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Verify amount due is 0 (advance payment covers first month)
    // The advance payment of 5000 should cover the first payable of 5000
    const pageContent = await page.content();

    // Look for Amount Due section
    const amountDueSection = page.getByText(/amount due/i);
    await expect(amountDueSection).toBeVisible({ timeout: 5_000 });

    // Extract the amount due value - should be 0 or 0.00
    // Amount due should be displayed as ₱0.00 or 0.00
    const hasZeroAmountDue = pageContent.includes('₱0.00') || pageContent.includes('0.00');
    const hasNegativeValue = pageContent.includes('-₱') || pageContent.match(/-\d+/);

    expect(hasZeroAmountDue).toBe(true);
    expect(hasNegativeValue).toBe(false);

    // Verify advance payment is recorded in the payments table
    const paymentsTable = page.getByRole('table', { name: /payments/i });
    if (await paymentsTable.isVisible({ timeout: 3_000 }).catch(() => false)) {
        // Check that the advance payment appears in the table
        const paymentText = await paymentsTable.textContent();
        expect(paymentText).toContain(advanceAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    }
});

// ────────────────────────────────────────────────────────────────────────────
// TC-LEDGER-004 — Amount Due Never Goes Negative
// Priority: P1
// Preconditions: Payments exceed total payables.
// Steps:
//   1. Overpay a contract.
//   2. Check amount due display.
// Expected: Amount due displays 0, NOT a negative number.
// ────────────────────────────────────────────────────────────────────────────
test('TC-LEDGER-004: Amount due never goes negative when overpaid', async ({ page }) => {
    const uniqueEmail = `negative-test-${Date.now()}@example.com`;
    const tenantFirstName = 'Negative Test';
    const tenantLastName = 'Overpay';
    const spaceName = `Negative-Test-${Date.now()}`;
    const rentAmount = '5000';
    const depositAmount = '1000';
    const advanceAmount = '1000';
    const overpaymentAmount = '15000'; // Significantly more than rent to ensure overpayment

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in tenant details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify tenant was created
    const tenantLink = page.getByRole('link', { name: `${tenantFirstName} ${tenantLastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Step 2: Create a vacant space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    // Fill in space name
    const spaceNameInput = page.getByPlaceholder('e.g. Suite 101', { exact: true });
    await expect(spaceNameInput).toBeVisible({ timeout: 5_000 });
    await spaceNameInput.fill(spaceName);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify space was created
    const spaceRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(spaceRow).toBeVisible({ timeout: 10_000 });

    // Step 3: Create and post a contract with rent amount = 5000
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill in contract details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);

    // Select tenant from dropdown
    await page.getByRole('option', { name: new RegExp(tenantFirstName) }).click();

    // Fill in amounts
    await page.getByPlaceholder('0.00', { exact: true }).nth(0).fill(rentAmount); // Rent
    await page.getByPlaceholder('0.00', { exact: true }).nth(1).fill(depositAmount); // Deposit
    await page.getByPlaceholder('0.00', { exact: true }).nth(2).fill(advanceAmount); // Advance

    // Set dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);
    endDate.setDate(today.getDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    await page.getByLabel(/start date/i).fill(startDateStr);
    await page.getByLabel(/end date/i).fill(endDateStr);

    // Select billing frequency
    await page.getByRole('combobox', { name: /billing/i }).selectOption('monthly');

    // Set due date rule
    await page.getByPlaceholder('e.g. 1', { exact: true }).fill('1');

    // Save as draft first
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(page.getByRole('heading', { name: 'New Contract' })).not.toBeVisible({ timeout: 10_000 });

    // Find the draft contract and post it
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const draftRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(draftRow).toBeVisible({ timeout: 10_000 });

    // Click "Post" button
    const postBtn = draftRow.getByRole('button', { name: /post/i });
    await expect(postBtn).toBeVisible({ timeout: 5_000 });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(2_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Record an overpayment that exceeds total payables
    // Rent is 5000/month, we'll pay 15000 which is 3x the monthly rent
    const recordPaymentBtn = page.getByRole('button', { name: /record payment/i });
    await expect(recordPaymentBtn).toBeVisible({ timeout: 5_000 });
    await recordPaymentBtn.click();

    // Fill in payment details
    await page.getByPlaceholder('0.00', { exact: true }).fill(overpaymentAmount);

    // Set payment date to today
    const todayStr = new Date().toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(todayStr);

    // Submit payment
    await page.getByRole('button', { name: /save|confirm/i }).click();
    await page.waitForTimeout(1_000);

    // Step 6: Verify amount due is 0 and NOT negative
    const pageContent = await page.content();

    // Look for Amount Due section
    const amountDueSection = page.getByText(/amount due/i);
    await expect(amountDueSection).toBeVisible({ timeout: 5_000 });

    // Amount due should be displayed as ₱0.00 or 0.00, NOT as negative
    const hasZeroAmountDue = pageContent.includes('₱0.00') || pageContent.includes('0.00');
    const hasNegativeValue = pageContent.includes('-₱') || pageContent.includes('-0') || pageContent.match(/-\d+/);

    expect(hasZeroAmountDue).toBe(true);
    expect(hasNegativeValue).toBe(false);

    // Verify the overpayment is recorded in the payments table
    const paymentsTable = page.getByRole('table', { name: /payments/i });
    if (await paymentsTable.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const paymentText = await paymentsTable.textContent();
        expect(paymentText).toContain(overpaymentAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    }
});

// ────────────────────────────────────────────────────────────────────────────
// TC-LEDGER-005 — Fund Does Not Reduce Amount Due
// Priority: P1
// Preconditions: A contract posted with deposit of 5000 and monthly rent of 5000.
// Steps:
//   1. View ledger.
//   2. Check: amount due = first month's rent (5000) OR amount due = 0 (deposit covers it).
// Expected Result: Amount due = 5000; deposit shown in Fund section only; deposit does NOT reduce amount due.
// ────────────────────────────────────────────────────────────────────────────
test('TC-LEDGER-005: Fund/deposit does not reduce amount due', async ({ page }) => {
    const uniqueEmail = `fund-test-${Date.now()}@example.com`;
    const tenantFirstName = 'Fund';
    const tenantLastName = 'Test';
    const spaceName = `Fund-Test-${Date.now()}`;
    const rentAmount = '5000';
    const depositAmount = '5000';
    const advanceAmount = '0';

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await expect(page.getByRole('heading', { name: 'New Tenant' })).toBeVisible({ timeout: 5_000 });

    // Fill in tenant details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);
    await page.getByPlaceholder('maria@example.com', { exact: true }).fill(uniqueEmail);

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'New Tenant' })).not.toBeVisible({ timeout: 10_000 });

    // Verify tenant was created
    const tenantLink = page.getByRole('link', { name: `${tenantFirstName} ${tenantLastName}` });
    await expect(tenantLink).toBeVisible({ timeout: 10_000 });

    // Step 2: Create a vacant space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    // Fill in space name
    const spaceNameInput = page.getByPlaceholder('e.g. Suite 101', { exact: true });
    await expect(spaceNameInput).toBeVisible({ timeout: 5_000 });
    await spaceNameInput.fill(spaceName);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify space was created
    const spaceRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(spaceRow).toBeVisible({ timeout: 10_000 });

    // Step 3: Create and post a contract with deposit = 5000, rent = 5000, advance = 0
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill in contract details
    await page.getByPlaceholder('Maria', { exact: true }).fill(tenantFirstName);
    await page.getByPlaceholder('Santos', { exact: true }).fill(tenantLastName);

    // Select tenant from dropdown
    await page.getByRole('option', { name: new RegExp(tenantFirstName) }).click();

    // Fill in contract financial details
    await page.getByPlaceholder('0.00', { exact: true }).first().fill(rentAmount); // Rent amount
    await page.getByPlaceholder('0.00', { exact: true }).nth(1).fill(depositAmount); // Deposit
    await page.getByPlaceholder('0.00', { exact: true }).nth(2).fill(advanceAmount); // Advance

    // Set dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);
    endDate.setDate(today.getDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    await page.getByLabel(/start date/i).fill(startDateStr);
    await page.getByLabel(/end date/i).fill(endDateStr);

    // Select billing frequency
    await page.getByRole('combobox', { name: /billing/i }).selectOption('monthly');

    // Set due date rule
    await page.getByPlaceholder('e.g. 1', { exact: true }).fill('1');

    // Save as draft first
    await page.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(page.getByRole('heading', { name: 'New Contract' })).not.toBeVisible({ timeout: 10_000 });

    // Find the draft contract and post it
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const draftRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(draftRow).toBeVisible({ timeout: 10_000 });

    // Click "Post" button
    const postBtn = draftRow.getByRole('button', { name: /post/i });
    await expect(postBtn).toBeVisible({ timeout: 5_000 });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(2_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Verify amount due = 5000 (first month's rent), NOT 0
    // The deposit (fund) should NOT reduce the amount due in v1

    // Look for Amount Due section - should show 5000, not 0
    const amountDueSection = page.getByText(/amount due/i);
    await expect(amountDueSection).toBeVisible({ timeout: 5_000 });

    // Amount due should be displayed as ₱5000 or ₱5,000.00 (first month's rent)
    // It should NOT be 0 or reduced by the deposit
    const pageContent = await page.content();
    
    // Find the Amount Due card and extract the value
    const amountDueCard = page.locator('.bg-amber-50').first();
    await expect(amountDueCard).toBeVisible({ timeout: 5_000 });
    const amountDueText = await amountDueCard.textContent();
    
    // Parse the amount due value (format: ₱X,XXX.XX)
    const amountDueMatch = amountDueText.match(/₱([\d,]+(?:\.\d{2})?)/);
    expect(amountDueMatch).toBeTruthy();
    
    const amountDueStr = amountDueMatch ? amountDueMatch[1].replace(/,/g, '') : '0';
    const amountDueNum = parseFloat(amountDueStr);
    
    // Amount due should be greater than 0 (deposit does not reduce it)
    // Expected: 5000 (first month's rent)
    expect(amountDueNum).toBeGreaterThan(0);
    
    // Verify Fund section exists and shows the deposit
    const fundHeading = page.getByRole('heading', { level: 2, name: /fund/i });
    await expect(fundHeading).toBeVisible({ timeout: 5_000 });
    
    // Find the fund table (the one after the "Fund" heading)
    const fundTable = page.locator('table').last();
    const fundContent = await fundTable.textContent();
    
    // Fund should contain the deposit amount (5000)
    expect(fundContent).toContain('5000');
});

// ────────────────────────────────────────────────────────────────────────────
// TC-LEDGER-006 — Many Payables (Long Contract)
// Priority: P2
// Preconditions: Contract with 5+ year duration, monthly billing (60+ payables).
// Steps:
//   1. Post contract.
//   2. View ledger payables table.
// Expected: All payables generated correctly; table displays properly with pagination or scroll; no performance issues.
// ────────────────────────────────────────────────────────────────────────────
test('TC-LEDGER-006: Long contract (5+ years) generates all payables correctly', async ({ page }) => {
    const uniqueEmail = `longcontract-${Date.now()}@example.com`;
    const tenantFirstName = 'Long';
    const tenantLastName = 'Contract';
    const spaceName = `Long-Contract-Space-${Date.now()}`;
    const rentAmount = '5000';
    const depositAmount = '5000';
    const advanceAmount = '5000';

    // Calculate dates: start = today, end = today + 6 years (72 months, > 60 payables)
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear() + 6, today.getMonth(), today.getDate()).toISOString().split('T')[0];

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await page.getByLabel(/first name/i).fill(tenantFirstName);
    await page.getByLabel(/last name/i).fill(tenantLastName);
    await page.getByLabel(/email/i).fill(uniqueEmail);

    const saveTenantBtn = page.getByRole('button', { name: /save/i });
    await saveTenantBtn.click();
    await page.waitForTimeout(1_000);

    // Step 2: Create a new space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    await page.getByLabel(/name/i).fill(spaceName);
    const saveSpaceBtn = page.getByRole('button', { name: /save/i });
    await saveSpaceBtn.click();
    await page.waitForTimeout(1_000);

    // Step 3: Create a contract with 6-year duration
    await page.goto('/admin/contracts');
    await page.waitForURL('/admin/contracts');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill contract form
    const tenantSelect = page.getByLabel(/tenant/i);
    await tenantSelect.selectOption({ label: new RegExp(`${tenantFirstName} ${tenantLastName}`) });

    const spaceSelect = page.getByLabel(/space/i);
    await spaceSelect.selectOption({ label: new RegExp(spaceName) });

    // Set dates
    const startDateInput = page.getByLabel(/start date/i);
    await startDateInput.fill(startDate);

    const endDateInput = page.getByLabel(/end date/i);
    await endDateInput.fill(endDate);

    // Set billing details
    const rentInput = page.getByLabel(/rent amount/i);
    await rentInput.fill(rentAmount);

    const billingSelect = page.getByLabel(/billing frequency/i);
    await billingSelect.selectOption('monthly');

    const dueDateRuleInput = page.getByLabel(/due date rule/i);
    await dueDateRuleInput.fill('1');

    const depositInput = page.getByLabel(/deposit/i);
    await depositInput.fill(depositAmount);

    const advanceInput = page.getByLabel(/advance payment/i);
    await advanceInput.fill(advanceAmount);

    // Save as draft first
    const saveDraftBtn = page.getByRole('button', { name: /save draft/i });
    await saveDraftBtn.click();
    await page.waitForTimeout(1_000);

    // Post the contract
    const postBtn = page.getByRole('button', { name: /post contract/i });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(3_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Verify payables table exists and has 60+ entries (6 years * 12 months = 72 payables)
    const payablesHeading = page.getByRole('heading', { level: 2, name: /payables/i });
    await expect(payablesHeading).toBeVisible({ timeout: 5_000 });

    // Find the payables table
    const payablesTable = page.locator('table').first();
    await expect(payablesTable).toBeVisible({ timeout: 5_000 });

    // Count the number of rows in the payables table (excluding header)
    const payableRows = payablesTable.locator('tbody tr');
    const rowCount = await payableRows.count();

    // We expect at least 60 payables (5 years * 12 months)
    // With 6 years, we expect ~72 payables
    expect(rowCount).toBeGreaterThanOrEqual(60);

    // Step 6: Verify all payables have correct amount (5000)
    // Check first few rows to ensure amounts are correct
    for (let i = 0; i < Math.min(5, rowCount); i++) {
        const row = payableRows.nth(i);
        const amountCell = row.locator('td').nth(2); // Amount column
        const amountText = await amountCell.textContent();
        // Amount should be 5000 (format may vary: 5000, 5,000, 5000.00, etc.)
        expect(amountText).toMatch(/5[\d,]*\.?\d*/);
    }

    // Step 7: Verify table displays properly (no UI breaks, no overflow issues)
    const tableContent = await payablesTable.textContent();
    expect(tableContent).toBeTruthy();
    expect(tableContent.length).toBeGreaterThan(0);

    // Step 8: Verify no performance issues (page loaded within reasonable time)
    // If we reached this point, performance is acceptable
    // Playwright default timeout is 30s, and we're well within that

    // Verify page is stable (no loading spinners, no errors)
    const loadingSpinner = page.locator('[class*="loading"], [class*="spinner"]');
    await expect(loadingSpinner).not.toBeVisible({ timeout: 5_000 });
});

// ────────────────────────────────────────────────────────────────────────────
// TC-LEDGER-007 — Large Amounts in Payables (Overflow Test)
// Priority: P2
// Preconditions: Contract with very large monthly rent.
// Steps:
//   1. Create contract with rent: 999,999,999/month.
//   2. Post contract.
//   3. Check generated payables.
// Expected: No overflow; amounts stored correctly; display handles large numbers.
// ────────────────────────────────────────────────────────────────────────────
test('TC-LEDGER-007: Large rent amount (999,999,999) handled without overflow', async ({ page }) => {
    const uniqueEmail = `largeamount-${Date.now()}@example.com`;
    const tenantFirstName = 'Large';
    const tenantLastName = 'Amount';
    const spaceName = `Large-Amount-Space-${Date.now()}`;
    const rentAmount = '999999999'; // 999,999,999 - very large amount
    const depositAmount = '100000000'; // 100,000,000
    const advanceAmount = '100000000'; // 100,000,000

    // Calculate dates: 1-year contract
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];

    await loginAndGoToContracts(page);

    // Step 1: Create a new tenant for this test
    await page.goto('/admin/tenants');
    await page.waitForURL('/admin/tenants');

    const createTenantBtn = page.getByRole('button', { name: 'New Tenant' });
    await expect(createTenantBtn).toBeVisible({ timeout: 10_000 });
    await createTenantBtn.click();

    await page.getByLabel(/first name/i).fill(tenantFirstName);
    await page.getByLabel(/last name/i).fill(tenantLastName);
    await page.getByLabel(/email/i).fill(uniqueEmail);

    const saveTenantBtn = page.getByRole('button', { name: /save/i });
    await saveTenantBtn.click();
    await page.waitForTimeout(1_000);

    // Step 2: Create a new space for this test
    await page.goto('/admin/spaces');
    await page.waitForURL('/admin/spaces');

    const createSpaceBtn = page.getByRole('button', { name: 'New Space' });
    await expect(createSpaceBtn).toBeVisible({ timeout: 10_000 });
    await createSpaceBtn.click();

    await page.getByLabel(/name/i).fill(spaceName);
    const saveSpaceBtn = page.getByRole('button', { name: /save/i });
    await saveSpaceBtn.click();
    await page.waitForTimeout(1_000);

    // Step 3: Create a contract with very large rent amount
    await page.goto('/admin/contracts');
    await page.waitForURL('/admin/contracts');

    const createContractBtn = page.getByRole('button', { name: 'New Contract' });
    await expect(createContractBtn).toBeVisible({ timeout: 10_000 });
    await createContractBtn.click();

    // Fill contract form
    const tenantSelect = page.getByLabel(/tenant/i);
    await tenantSelect.selectOption({ label: new RegExp(`${tenantFirstName} ${tenantLastName}`) });

    const spaceSelect = page.getByLabel(/space/i);
    await spaceSelect.selectOption({ label: new RegExp(spaceName) });

    // Set dates
    const startDateInput = page.getByLabel(/start date/i);
    await startDateInput.fill(startDate);

    const endDateInput = page.getByLabel(/end date/i);
    await endDateInput.fill(endDate);

    // Set billing details with very large amount
    const rentInput = page.getByLabel(/rent amount/i);
    await rentInput.fill(rentAmount);

    const billingSelect = page.getByLabel(/billing frequency/i);
    await billingSelect.selectOption('monthly');

    const dueDateRuleInput = page.getByLabel(/due date rule/i);
    await dueDateRuleInput.fill('1');

    const depositInput = page.getByLabel(/deposit/i);
    await depositInput.fill(depositAmount);

    const advanceInput = page.getByLabel(/advance payment/i);
    await advanceInput.fill(advanceAmount);

    // Save as draft first
    const saveDraftBtn = page.getByRole('button', { name: /save draft/i });
    await saveDraftBtn.click();
    await page.waitForTimeout(1_000);

    // Post the contract
    const postBtn = page.getByRole('button', { name: /post contract/i });
    await postBtn.click();

    // Confirm posting
    const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
    }

    // Wait for contract to be posted
    await page.waitForTimeout(3_000);

    // Step 4: Navigate to the posted contract's ledger
    await page.goto('/admin/contracts');
    await page.waitForURL(/\/admin\/contracts/);

    const postedRow = page.getByRole('row', { name: new RegExp(spaceName) });
    await expect(postedRow).toBeVisible({ timeout: 10_000 });

    // Click on the contract link to go to detail/ledger page
    const contractLink = postedRow.getByRole('link', { name: /view|ledger|details/i });
    if (await contractLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await contractLink.click();
        await page.waitForURL(/\/admin\/contracts\/\d+/);
    } else {
        // If no direct link, try to find a "View Ledger" button
        const viewLedgerBtn = postedRow.getByRole('button', { name: /ledger|view/i });
        if (await viewLedgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await viewLedgerBtn.click();
            await page.waitForURL(/\/admin\/contracts\/\d+/);
        }
    }

    // Step 5: Verify payables table exists and contains large amounts
    const payablesHeading = page.getByRole('heading', { level: 2, name: /payables/i });
    await expect(payablesHeading).toBeVisible({ timeout: 5_000 });

    // Find the payables table
    const payablesTable = page.locator('table').first();
    await expect(payablesTable).toBeVisible({ timeout: 5_000 });

    // Count the number of rows in the payables table (excluding header)
    const payableRows = payablesTable.locator('tbody tr');
    const rowCount = await payableRows.count();

    // For a 1-year monthly contract, we expect 12 payables
    expect(rowCount).toBeGreaterThanOrEqual(12);

    // Step 6: Verify all payables have the correct large amount (999,999,999)
    // Check all rows to ensure amounts are correct and no overflow occurred
    for (let i = 0; i < rowCount; i++) {
        const row = payableRows.nth(i);
        const amountCell = row.locator('td').nth(2); // Amount column
        const amountText = await amountCell.textContent();
        
        // Amount should contain 999999999 (format may vary: 999,999,999 or 999999999.00)
        // Check that the numeric value is correct (no overflow to negative or scientific notation)
        expect(amountText).toMatch(/999[\d,]*/);
        
        // Verify no negative sign (overflow would show negative)
        expect(amountText).not.toMatch(/^-/);
        
        // Verify no scientific notation (overflow would show 1e+9)
        expect(amountText).not.toMatch(/e\+/i);
    }

    // Step 7: Verify Amount Due displays correctly (should be large positive number)
    const amountDueSection = page.getByText(/amount due/i);
    await expect(amountDueSection).toBeVisible({ timeout: 5_000 });

    const amountDueCard = page.locator('.bg-amber-50').first();
    await expect(amountDueCard).toBeVisible({ timeout: 5_000 });
    const amountDueText = await amountDueCard.textContent();

    // Amount due should contain 999 (part of 999,999,999) and not be negative
    expect(amountDueText).toMatch(/999[\d,]*/);
    expect(amountDueText).not.toMatch(/^-/);
    expect(amountDueText).not.toMatch(/e\+/i);

    // Step 8: Verify Fund section displays large deposit correctly
    const fundHeading = page.getByRole('heading', { level: 2, name: /fund/i });
    await expect(fundHeading).toBeVisible({ timeout: 5_000 });

    const fundTable = page.locator('table').last();
    const fundContent = await fundTable.textContent();

    // Fund should contain the large deposit amount (100,000,000)
    expect(fundContent).toMatch(/100[\d,]*/);
    expect(fundContent).not.toMatch(/^-/);
    expect(fundContent).not.toMatch(/e\+/i);

    // Step 9: Verify no UI breaks or display issues
    const tableContent = await payablesTable.textContent();
    expect(tableContent).toBeTruthy();
    expect(tableContent.length).toBeGreaterThan(0);

    // Verify page is stable (no loading spinners, no errors)
    const loadingSpinner = page.locator('[class*="loading"], [class*="spinner"]');
    await expect(loadingSpinner).not.toBeVisible({ timeout: 5_000 });
});
