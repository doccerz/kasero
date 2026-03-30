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
});
