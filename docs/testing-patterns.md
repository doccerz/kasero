# Testing Patterns

## Testing

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

Test critical paths and error handling.

---

## SIT/UAT Playwright Tests (against Docker stack)

SIT/UAT test specs live in `apps/web/e2e/sit-*.spec.ts`. Each file maps to a test group in `specs/v1/qa/cycle-N/plan.md`.

### Prerequisites

```bash
# Start the full stack
docker compose up -d --build
```

### Running a SIT spec

```bash
cd apps/web
npx playwright test e2e/sit-auth.spec.ts --reporter=list
```

`PLAYWRIGHT_BASE_URL` defaults to `http://localhost:3000`. Admin credentials are read from env vars (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) and default to values in `.env`.

### Coverage mapping

| Spec file | Test group |
|-----------|-----------|
| `e2e/sit-auth.spec.ts` | TC-AUTH-001 to TC-AUTH-005 |
| `e2e/sit-cycle2-auth.spec.ts` | TC-AUTH-006 to TC-AUTH-010 (Cycle 2 edge cases) |
| `e2e/sit-cycle2-dashboard.spec.ts` | TC-DASH-004 to TC-DASH-007 |
| `e2e/sit-cycle2-spaces.spec.ts` | TC-SPACE-007 to TC-SPACE-012 |

---

## Service Unit Test Mock Patterns

### Standard `buildMockDb` with join + transaction support

```typescript
function buildMockDb({ selectRows = [], mutationRows = [] } = {}) {
    const returning = jest.fn().mockResolvedValue(mutationRows);
    const whereForMutation = jest.fn().mockReturnValue({ returning });
    const set = jest.fn().mockReturnValue({ where: whereForMutation });
    const values = jest.fn().mockReturnValue({ returning });
    const whereForSelect = jest.fn().mockResolvedValue(selectRows);
    const leftJoin = jest.fn().mockReturnValue({ where: whereForSelect });
    const from = jest.fn().mockReturnValue({ where: whereForSelect, leftJoin });
    return {
        select: jest.fn().mockReturnValue({ from }),
        insert: jest.fn().mockReturnValue({ values }),
        update: jest.fn().mockReturnValue({ set }),
        transaction: jest.fn(),
        _from: from,
        _leftJoin: leftJoin,
        _whereForSelect: whereForSelect,
        _whereForMutation: whereForMutation,
        _returning: returning,
    };
}
```

### Transaction mock pattern

```typescript
const tx = {
    update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([row]) }) }) }),
    insert: jest.fn().mockReturnValue({ values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }) }),
};
mockDb.transaction.mockImplementation(async (fn) => fn(tx));
```

Inspect which tables were inserted into: `tx.insert.mock.calls[N][0]` is the table reference.

### Multiple sequential `select` calls (e.g., `findOne` before `update`/`post`)

```typescript
mockDb.select
    .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([existingRow]) }) })
    .mockReturnValueOnce({ ... }); // second call if needed
```

---

## Controller Test Pattern

### Guard integration (real guard, mock JwtService)

```typescript
const mockJwtService = { verify: jest.fn() };
// module uses real JwtAuthGuard + mock JwtService
// GET /admin/resource without token → 401
// GET /admin/resource with valid token → not 401
```

### Endpoint tests (guard bypassed, mock service)

```typescript
Test.createTestingModule({ controllers: [MyController], providers: [{ provide: MyService, useValue: mockService }] })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();
```

---

## Integration Test Patterns

### DB-conditional tests

```typescript
const hasDatabaseUrl = !!process.env.DATABASE_URL;
(hasDatabaseUrl ? describe : describe.skip)('DB integration', () => { ... });
(hasDatabaseUrl ? it : it.skip)('...', async () => { ... });
```

### No-cleanup integration tests (no-hard-delete tables)

For `contracts`, `payables`, `payments`, `fund`, `public_access_codes`: hard delete is blocked by DB trigger.
- Use fresh UUID `spaceId` + `tenantId` per test run
- Accept leftover data — it will not conflict across runs as long as unique identifiers differ

### Transaction rollback cleanup (alternative when delete is blocked)

```typescript
let client: pg.PoolClient;
beforeAll(async () => { client = await pool.connect(); await client.query('BEGIN'); });
afterAll(async () => { await client.query('ROLLBACK'); client.release(); });
```

### SAVEPOINT for expected-to-fail operations

```typescript
await client.query('SAVEPOINT sp_name');
await expect(blockedOperation()).rejects.toThrow();
await client.query('ROLLBACK TO SAVEPOINT sp_name');
// transaction is now recovered for subsequent tests
```

---

## Pure Helper Test Isolation

Export pure helpers from service files as named exports so they can be unit-tested without a full module setup:

```typescript
// contracts.service.ts
export function generatePayables(params) { ... }

// contracts.service.spec.ts
import { generatePayables } from './contracts.service';
describe('generatePayables', () => { ... });
```

---

## Cycle 2 Playwright Test Patterns (Edge Cases)

### Test file structure template

```typescript
/**
 * SIT/UAT Cycle 2 — <Module> Edge Cases
 * Tests: TC-XXX-007 through TC-XXX-012
 * Run against: PLAYWRIGHT_BASE_URL=http://localhost:3000
 */
import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'replace-with-a-strong-password';

async function loginAndGoTo<Page>(page: import('@playwright/test').Page) {
    await page.goto('/admin/login');
    await page.getByLabel(/username/i).fill(ADMIN_USER);
    await page.getByLabel(/password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/\/admin\/(dashboard|spaces)/);
    await page.goto('/admin/<page>');
}
```

### Pattern: Testing with special characters

```typescript
test('TC-SPACE-007: Space name with special characters', async ({ page }) => {
    const specialName = 'Unit 101-B (Ground Floor) <test> !@#$%^&*()';
    
    await loginAndGoToSpaces(page);
    await page.getByRole('button', { name: 'New Space' }).click();
    
    const nameInput = page.locator('#space-name').or(page.getByPlaceholder('e.g. Unit 1A'));
    await nameInput.fill(specialName);
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Verify special characters preserved
    const spaceEntry = page.getByText('Unit 101-B (Ground Floor)', { exact: false });
    await expect(spaceEntry).toBeVisible({ timeout: 10_000 });
});
```

### Pattern: Testing with Unicode/accented characters

```typescript
test('TC-SPACE-008: Space name with Unicode characters', async ({ page }) => {
    const unicodeName = 'Piso Uno — Áéíóú Ñ';
    
    await loginAndGoToSpaces(page);
    // ... fill form ...
    await nameInput.fill(unicodeName);
    
    // Verify Unicode preserved
    const fullText = await spaceEntry.textContent();
    expect(fullText).toContain('Áéíóú Ñ');
});
```

### Pattern: Testing boundary conditions (long strings)

```typescript
test('TC-SPACE-009: Very long space name (255 chars)', async ({ page }) => {
    const longName = 'A'.repeat(255);
    const longDescription = 'B'.repeat(1000);
    
    await loginAndGoToSpaces(page);
    // ... fill form with long values ...
    
    // Either validation error OR successful save
    const validationError = page.getByText(/too long|max.*length|exceed/i).first();
    const hasValidationError = await validationError.isVisible({ timeout: 3_000 }).catch(() => false);
    
    if (hasValidationError) {
        expect(hasValidationError).toBe(true);
    } else {
        // Verify save succeeded
        await expect(nameInput).not.toBeVisible({ timeout: 10_000 });
        const spaceEntry = page.getByText(longName.substring(0, 50), { exact: false });
        await expect(spaceEntry).toBeVisible({ timeout: 10_000 });
    }
});
```

### Pattern: Testing auth edge cases with cookies

```typescript
test('TC-AUTH-006: Expired JWT token redirects to login', async ({ page, context }) => {
    const expiredToken = jwt.sign(
        { sub: 'admin', username: ADMIN_USER },
        JWT_SECRET,
        { expiresIn: -3600 } // expired 1 hour ago
    );
    
    await context.addCookies([{
        name: 'auth_token',
        value: expiredToken,
        domain: 'localhost',
        path: '/',
    }]);
    
    await page.goto('/admin/spaces');
    await expect(page).toHaveURL(/\/admin\/login/);
});
```

### Pattern: Testing SQL injection / XSS attempts

```typescript
test('TC-AUTH-009: SQL injection in username field', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel(/username/i).fill("' OR 1=1 --");
    await page.getByLabel(/password/i).fill('anypassword');
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Should stay on login page
    await expect(page).not.toHaveURL(/\/admin\/(?!login)/);
    
    // No SQL error text exposed
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/sql|syntax error|pg|postgres/i);
});
```

### Pattern: Handling optional fields gracefully

```typescript
// Try to fill description if field exists (may be textarea or optional)
const descriptionInput = page.locator('textarea').or(page.getByPlaceholder(/description/i));
const descriptionCount = await descriptionInput.count();
if (descriptionCount > 0) {
    const descVisible = await descriptionInput.first().isVisible();
    if (descVisible) {
        await descriptionInput.first().fill(longDescription);
    }
}
```

### Key patterns learned from Cycle 2

1. **Flexible locators**: Use `.or()` chains to handle UI variations:
   - `page.locator('#space-name').or(page.getByPlaceholder('e.g. Unit 1A'))`
   - `page.locator('textarea').or(page.getByPlaceholder(/description/i))`

2. **Graceful degradation**: Tests should handle both success and validation error paths as valid outcomes for boundary tests.

3. **Cookie injection for auth tests**: Use `context.addCookies()` to inject JWT tokens (valid, expired, or malformed) for testing auth guards.

4. **Timeout management**: Use explicit timeouts (`{ timeout: 10_000 }`) for UI state changes; shorter timeouts (`{ timeout: 3_000 }`) for optional elements.

5. **Substring matching for long values**: When verifying 255-char names, check first 50 chars rather than full string.