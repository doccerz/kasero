# Phase 6 — Contracts: Draft, Posting, and Immutability

## Context

Phase 6 implements the operational core of the application: contract lifecycle management. The schema, DB triggers, and migrations are already in place (immutability trigger, no-hard-delete trigger, `uq_space_one_active_contract` partial index). The contracts module exists as empty stubs. This plan fills those stubs with full CRUD plus the atomic posting transaction that generates the entire financial state (payables, fund entry, advance payment, public access code).

---

## TDD Sequence

```
Write failing tests → commit → implement → commit → verify all tests pass → commit
```

**Step 1** ✅ — Write `contracts.service.spec.ts` and `contracts.controller.spec.ts` (all tests will fail)
**Step 2** ✅ — `git commit test(contracts): add failing unit tests for service and controller`
**Step 3** ✅ — Implement `contracts.service.ts` and `contracts.controller.ts`
**Step 4** ✅ — `git commit feat(contracts): implement draft/post/update with payables generation`
**Step 5** ✅ — All tests pass → final commit

---

## Files to Modify

| File | Action |
|------|--------|
| `apps/api/src/contracts/contracts.service.ts` | Implement (currently empty stub) |
| `apps/api/src/contracts/contracts.controller.ts` | Implement (currently empty stub) |
| `apps/api/src/contracts/contracts.service.spec.ts` | Create |
| `apps/api/src/contracts/contracts.controller.spec.ts` | Create |

No schema or migration changes needed — everything is already in place.

---

## Service Methods

### `findAll()`
```typescript
this.db
  .select({ ...getTableColumns(contracts), tenantName: sql<string>`${tenants.firstName} || ' ' || ${tenants.lastName}` })
  .from(contracts)
  .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
```
Returns all contracts (no where clause — no soft-delete on contracts).

### `findOne(id: string)`
`select().from(contracts).where(eq(contracts.id, id))` → throw `NotFoundException` if empty.

### `create(data)`
`insert(contracts).values(data).returning()` → return `rows[0]`. Status defaults to `'draft'` via column default.

### `update(id, data)`
1. Call `findOne(id)` — propagates `NotFoundException`
2. If `existing.status === 'posted'` → throw `BadRequestException('Cannot modify a posted contract')`
3. `update(contracts).set({ ...data, updatedAt: new Date() }).where(eq(contracts.id, id)).returning()`
4. Return `rows[0]`

### `post(id: string)` — Atomic Transaction
Pre-fetch: `const existing = await this.findOne(id)`

Compute payables: `const payableRows = generatePayables({ contractId: id, ...existing })`

```typescript
try {
    return await this.db.transaction(async (tx) => {
        // 1. Transition to posted
        const [posted] = await tx.update(contracts).set({ status: 'posted', updatedAt: new Date() })
            .where(eq(contracts.id, id)).returning();

        // 2. Public access code (DB auto-generates UUID)
        await tx.insert(publicAccessCodes).values({ contractId: id });

        // 3. Fund entry for deposit
        if (existing.depositAmount) {
            await tx.insert(fund).values({ contractId: id, type: 'deposit', amount: existing.depositAmount });
        }

        // 4. Advance payment
        if (existing.advanceMonths && existing.advanceMonths > 0) {
            const advanceAmount = (parseFloat(existing.rentAmount) * existing.advanceMonths).toFixed(2);
            await tx.insert(payments).values({
                contractId: id,
                amount: advanceAmount,
                date: existing.startDate,
            });
        }

        // 5. All recurring payables
        if (payableRows.length > 0) {
            await tx.insert(payables).values(payableRows);
        }

        return posted;
    });
} catch (err: any) {
    if (err?.code === '23505') throw new ConflictException('A posted contract already exists for this space');
    throw err;
}
```

---

## `generatePayables` — Pure Exported Helper

**Location**: exported from `contracts.service.ts` as a named export (tested independently).

**Algorithm**:
```typescript
export function generatePayables(params: { contractId, startDate, endDate, rentAmount, billingFrequency, dueDateRule })
```

- Parse dates as `Date.UTC(y, m-1, d)` — no timezone issues
- Step map: `{ monthly: 1, quarterly: 3, annually: 12 }`
- Cursor-based loop: `while (cursor <= end)`
  - `periodEnd = min(cursor + step - 1 day, endDate)`
  - `dueDate` = `min(dueDateRule, daysInMonth)` of `periodStart`'s month
  - Emit `{ contractId, periodStart, periodEnd, amount: rentAmount, dueDate }` as `'YYYY-MM-DD'` strings
  - Advance `cursor = addMonths(cursor, step)`
- `addMonths` must clamp day to target month length to avoid JS overflow (e.g. Jan 31 + 1 month → Feb 28, not March 3)
- Output `'YYYY-MM-DD'` strings via `toYMD()` helper (no external libs)

---

## Controller Routes

```typescript
@UseGuards(JwtAuthGuard)
@Controller('admin/contracts')
export class ContractsController {
    @Get()          findAll()
    @Get(':id')     findOne(@Param('id') id)
    @Post()         create(@Body() body: { tenantId, spaceId, startDate, endDate, rentAmount, billingFrequency, dueDateRule, depositAmount?, advanceMonths?, metadata? })
    @Patch(':id')   update(@Param('id') id, @Body() body: Partial<...>) // no status field
    @Post(':id/post') @HttpCode(200) post(@Param('id') id)
    // No DELETE route — DB trigger blocks it; 404 returned automatically
}
```

---

## Test Cases

### `contracts.service.spec.ts`

**`buildMockDb` helper** — extend standard pattern to support:
- `select().from().leftJoin().where()` (for `findAll` with join)
- `db.transaction(fn)` → `fn(tx)` where `tx` has full mutation chain

**`generatePayables` unit tests** (pure function, exported):
- monthly 3-month → 3 payables with correct period boundaries
- dueDate clamped in Feb (rule=31 → day 28)
- last period `periodEnd` clamped to `endDate`
- quarterly produces 3-month periods
- annually: 2-year → 2 payables
- `startDate > endDate` → empty array

**Service tests**:
- `findAll` returns rows; uses leftJoin
- `findOne` returns contract; throws `NotFoundException` when missing
- `create` inserts and returns
- `update` on draft → calls `db.update` with `updatedAt`
- `update` on posted → throws `BadRequestException` before DB call
- `post` executes transaction; inserts publicAccessCode, fund (when deposit set), payment (when advanceMonths > 0), payables
- `post` skips fund when `depositAmount` null; skips payment when `advanceMonths = 0`
- `post` catches PG error `23505` → `ConflictException`
- `post` re-throws non-23505 errors

**Integration tests** (guarded by `hasDatabaseUrl`):
- create → findOne returns draft
- post → status posted, payables exist, publicAccessCode exists
- post same space twice → `ConflictException`
- update posted → `BadRequestException`
- Note: no cleanup (no-hard-delete trigger); use fresh UUID space/tenant per run

### `contracts.controller.spec.ts`

**Guard tests** (real `JwtAuthGuard`, mock `JwtService`):
- `GET /admin/contracts` without token → 401
- `GET /admin/contracts` with valid token → not 401

**Endpoint tests** (guard bypassed, mock service):
- `GET /admin/contracts` → 200
- `GET /admin/contracts/:id` → 200; `NotFoundException` → 404
- `POST /admin/contracts` → 201
- `PATCH /admin/contracts/:id` → 200; `BadRequestException` → 400; `NotFoundException` → 404
- `POST /admin/contracts/:id/post` → 200; `ConflictException` → 409
- `DELETE /admin/contracts/:id` → 404 (no route exists)

---

## Verification

```bash
npm test --workspace=apps/api          # all unit tests pass
DATABASE_URL=... npm test --workspace=apps/api   # integration tests run
```

Key invariants to confirm manually (DB-level):
- A space can only have one posted contract (unique index fires correctly)
- Patching a posted contract's `startDate` via PATCH → 400 from service guard; DB trigger as backstop
- `generatePayables` count matches `(endDate - startDate) / period` for clean date ranges

<promise>COMPLETE</promise>
