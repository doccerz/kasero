# Phase 12 — Testing & Business Rule Validation

## Context
Phase 12 validates business invariants and edge cases with database-backed tests. Most unit tests already exist. The primary gap is **LedgersService integration tests** (currently 3 `.todo()` stubs) and missing integration coverage for **public access code resolution**. Everything else (DB triggers, contract immutability, tenant expiration, conflict prevention) is already covered in `schema.spec.ts` and `contracts.service.spec.ts`.

## Branch
Create `feat/phase-12-testing-and-business-rule-validation` off current HEAD (after ensuring phase 09 work is committed).

## Current Coverage (already exists — do not duplicate)
- `database/schema.spec.ts` — DB trigger tests: contract immutability, payment void audit, tenant expiration, hard-delete prevention
- `contracts/contracts.service.spec.ts` — posting flow, conflict (overlapping contracts), fund/payment separation
- `tenants/tenants.service.spec.ts` — expired tenant visibility (2 integration tests)
- All services — unit tests with mocked DB

## What Needs to Be Added

### ✅ Task 1 — LedgersService integration tests [COMPLETE]
**File**: `apps/api/src/ledgers/ledgers.service.spec.ts`

Replace the 3 `.todo()` stubs inside `(hasDatabaseUrl ? describe : describe.skip)('LedgersService integration', ...)` with real tests.

**Setup** (beforeAll): Create space + tenant + post a contract (3-month range, monthly, rentAmount='1000.00', depositAmount='2000.00', advanceMonths=1). This produces:
- 3 payables (Jan/Feb/Mar 2024 — past dates, so all count toward amount_due)
- 1 fund row (deposit, amount='2000.00')
- 1 payment row (advance, amount='1000.00')

Use `new ContractsService(db)` pattern (same as contracts integration tests).
Use fresh UUIDs per run. No cleanup needed (no-hard-delete constraint).

**Test 1**: `getLedger returns real data from DB`
- Call `service.getLedger(contractId)`
- Assert `payables.length === 3`
- Assert `fund.length === 1`, `fund[0].type === 'deposit'`
- Assert `payments.length === 1` (advance payment)
- Assert `amount_due` = totalOwed (3×1000=3000) - totalPaid (1×1000=1000) = `'2000.00'`

**Test 2**: `recordPayment inserts into payments table`
- Call `service.recordPayment(contractId, { amount: '500.00' })`
- Assert returned row has `.id` (UUID) and `.amount === '500.00'`
- Query DB directly: `db.select().from(payments).where(eq(payments.id, result.id))` → expect 1 row

**Test 3**: `voidPayment sets voided_at and triggers audit insert`
- Record a new payment first (amount='100.00')
- Call `service.voidPayment(paymentId)`
- Assert `result.voidedAt` is set (truthy)
- Query audit table: `db.select().from(audit).where(eq(audit.subjectId, paymentId))` → expect 1 row with `action='void'`

### ✅ Task 2 — PublicAccessService integration test [COMPLETE]
**File**: `apps/api/src/public-access/public-access.service.spec.ts`

Add a `(hasDatabaseUrl ? describe : describe.skip)('PublicAccessService integration', ...)` block at the end.

**Setup** (beforeAll): Create space + tenant + post contract → retrieve the generated public access code from `publicAccessCodes` table. Instantiate `new PublicAccessService(db, ledgersService)`.

**Test**: `getPublicStatus resolves a valid public code to ledger data`
- Call `service.getPublicStatus(code)`
- Assert result has `contractId` matching the posted contract
- Assert result has `payables`, `payments`, `fund`, `amount_due` (standard ledger shape)
- Assert `amount_due` is a string formatted to 2 decimals

## Patterns to Follow
- Import `db` via `await import('../database/database')` inside `beforeAll`
- Import schema tables via `await import('../database/schema')`
- Use `new ServiceName(db)` directly (no NestJS module setup)
- Use fresh `crypto.randomUUID()` per test run for spaceId/tenantId
- No cleanup — no-hard-delete constraint means leftover data is fine
- Reference `contracts.service.spec.ts` lines 439–541 for the exact setup pattern

## Key Files
| File | Action |
|------|--------|
| `apps/api/src/ledgers/ledgers.service.spec.ts` | Replace 3 todos with real integration tests (lines 273–277) |
| `apps/api/src/public-access/public-access.service.spec.ts` | Add integration describe block at end |
| `apps/api/src/contracts/contracts.service.spec.ts` | Already has integration tests — reuse pattern |
| `apps/api/src/database/schema.ts` | Read to confirm `audit` table column names |
| `apps/api/src/public-access/public-access.service.ts` | Read constructor signature before instantiating |
| `apps/api/src/ledgers/ledgers.service.ts` | Read constructor signature before instantiating |

## Verification
```bash
# With real DB — integration tests run
DATABASE_URL=postgres://admin:admin@localhost:5432/kasero_test npm test --workspace=apps/api

# Without DB — integration tests skip, suite passes
npm test --workspace=apps/api
```

Expected: all unit tests pass in CI (no DATABASE_URL), integration tests pass locally.

## TDD Workflow
1. Write failing test stubs (replace todos with real test bodies) → commit
2. Run with DATABASE_URL → confirm tests actually exercise DB → commit
3. Fix any failures → commit
4. All tests green → commit
5. Update CLAUDE.md → commit
6. Create PR to staging

<promise>COMPLETE</promise>
