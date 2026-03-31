import { test, expect } from '@playwright/test';
import { setupAuth, isDockerMode } from './auth-helper';

test.describe('Admin contract detail', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page);
    });

    test('shows contract summary, amount due, and all ledger tables', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture contract-1 with ledger data');
        await page.goto('/admin/contracts/contract-1');
        await expect(page.getByText('Maria Santos')).toBeVisible();
        await expect(page.getByText(/amount due/i).first()).toBeVisible();
        await expect(page.getByRole('heading', { name: /payables/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /fund/i })).toBeVisible();
    });

    test('shows payables table data', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture contract-1 with ledger data');
        await page.goto('/admin/contracts/contract-1');
        await expect(page.getByRole('cell', { name: '2025-01-01' })).toBeVisible();
        await expect(page.getByRole('cell', { name: '2025-02-01' })).toBeVisible();
    });

    test('shows voided payment with strikethrough styling', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture contract-1 with voided payment');
        await page.goto('/admin/contracts/contract-1');
        const voidedRow = page.locator('tr', { hasText: '2025-02-12' });
        await expect(voidedRow).toBeVisible();
        await expect(voidedRow).toHaveClass(/line-through/);
    });

    test('shows contract not found for unknown id', async ({ page }) => {
        await page.goto('/admin/contracts/bad-id');
        await expect(page.getByText(/contract not found/i)).toBeVisible();
    });

    test('POST /api/admin/contracts/:id/void proxies to backend and returns 200', async ({ request }) => {
        const res = await request.post('/api/admin/contracts/contract-1/void');
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toMatchObject({ id: 'contract-1', status: 'voided' });
    });

    test('shows Billing Date column in payables table', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture with billingDate');
        await page.goto('/admin/contracts/contract-1');
        await expect(page.getByRole('columnheader', { name: /billing date/i })).toBeVisible();
    });

    test('Void Contract button visible for posted contract', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture contract-1 with posted status');
        await page.goto('/admin/contracts/contract-1');
        await expect(page.getByRole('button', { name: /void contract/i })).toBeVisible();
    });

    test('Void Contract confirmation modal shows warning message', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture contract-1 with posted status');
        await page.goto('/admin/contracts/contract-1');
        await page.getByRole('button', { name: /void contract/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/voiding prevents future payments/i)).toBeVisible();
    });

    test('Record Payment modal date defaults to today', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture contract-1 with posted status');
        await page.goto('/admin/contracts/contract-1');
        await page.getByRole('button', { name: /record payment/i }).click();
        const today = new Date().toISOString().split('T')[0];
        await expect(page.getByLabel(/date/i)).toHaveValue(today);
    });

    test('billingDateRule field shown in Edit Contract modal', async ({ page }) => {
        test.skip(isDockerMode, 'Requires mock fixture with draft contract');
        await page.goto('/admin/contracts/contract-2');
        await page.getByRole('button', { name: /edit contract/i }).click();
        await expect(page.getByLabel(/billing date rule/i)).toBeVisible();
    });
});

test.describe('Admin contracts index page', () => {
    test('/admin/contracts redirects to /admin/spaces', async ({ page }) => {
        await setupAuth(page);
        await page.goto('/admin/contracts');
        await expect(page).toHaveURL(/\/admin\/spaces/);
    });
});
