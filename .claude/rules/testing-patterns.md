# Testing Patterns

## Testing

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

Test critical paths and error handling.

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