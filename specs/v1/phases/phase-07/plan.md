# Phase 7 — Financial Model & Ledger Implementation

## Context

Phase 6 implemented contracts (draft/post lifecycle) including the atomic posting transaction that generates payables, fund entries, and advance payment records. The database tables (`payables`, `payments`, `fund`, `audit`) already exist and are populated on contract post.

Phase 7 builds the **read/write surface** for these ledgers:
- View a contract's full ledger (payables + payments + fund + computed amount_due)
- Record manual payments against a contract
- Void a payment (auditable via existing DB trigger)

The `LedgersModule` exists as an empty stub ready to be implemented.

---

## API Endpoints to Implement

```
GET  /admin/contracts/:id/ledger     → view payables + payments + fund + amount_due
POST /admin/contracts/:id/payments   → record a new payment
POST /admin/payments/:id/void        → void a payment (DB trigger auto-creates audit row)
```

---

## Architecture

### Two controllers, one module

The routes span two path prefixes, so `LedgersModule` will register two controllers:

- **`ContractLedgerController`** — repurpose existing `ledgers.controller.ts`, change `@Controller` to `'admin/contracts/:id'`. Handles `GET ledger` and `POST payments`.
- **`PaymentsController`** — new file `payments.controller.ts` at `@Controller('admin/payments/:id')`. Handles `POST void` with `@HttpCode(200)`.

---

## LedgersService Methods

```typescript
// Returns payables, payments, fund, and computed amount_due
getLedger(contractId: string, referenceDate?: string): Promise<LedgerView>

// Inserts a new payment; date defaults to today
recordPayment(contractId: string, data: { amount: string; date?: string }): Promise<PaymentRow>

// Sets voidedAt; DB trigger auto-creates audit record
voidPayment(paymentId: string): Promise<PaymentRow>
```

### Amount Due Formula

```
totalOwed  = SUM(payables WHERE dueDate <= referenceDate)
totalPaid  = SUM(payments WHERE voidedAt IS NULL)
amount_due = Math.max(0, totalOwed - totalPaid).toFixed(2)
```

- `referenceDate` defaults to today (`new Date().toISOString().split('T')[0]`)
- `numeric` columns from pg return as strings → use `parseFloat()`, then `.toFixed(2)`
- Use `Promise.all` for three parallel queries (payables, payments, fund)
- Filter for amount_due in JS (bounded dataset; keeps logic unit-testable)
- Fund entries are returned but do NOT affect amount_due

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `apps/api/src/ledgers/ledgers.service.ts` | Implement service |
| `apps/api/src/ledgers/ledgers.controller.ts` | Repurpose: rename class, change path, add routes |
| `apps/api/src/ledgers/payments.controller.ts` | Create: void endpoint |
| `apps/api/src/ledgers/ledgers.module.ts` | Add `PaymentsController` to controllers array |
| `apps/api/src/ledgers/ledgers.service.spec.ts` | Create: unit + integration tests |
| `apps/api/src/ledgers/ledgers.controller.spec.ts` | Create: controller tests |
| `apps/api/src/ledgers/payments.controller.spec.ts` | Create: controller tests |
| `apps/api/src/ledgers/ledgers.module.spec.ts` | Update: compile test covers both controllers |
| `specs/v1/phases/phase-07/progress.txt` | Update with completion notes |

---

## Key Implementation Notes

- **voidPayment**: check payment exists (`NotFoundException`), check not already voided (`BadRequestException`), then `UPDATE payments SET voided_at = NOW() WHERE id = $1`. The existing `trg_payment_void_audit` DB trigger auto-inserts into `audit` — no application-layer audit write needed.
- **No NotFoundException on getLedger for unknown contractId** — empty arrays + `"0.00"` is acceptable per spec scope.
- Pattern reference: `@HttpCode(200)` on POST void (same as `contracts.controller.ts:42-46`).
- Pattern reference: `DB_TOKEN` inject, `eq()` from `drizzle-orm`, `isNull()` for void filter.

---

## TDD Sequence (per project rules)

### Step 1 — Write failing service tests ✅ COMPLETE
Create `ledgers.service.spec.ts` with unit tests for all 3 methods + integration stubs.
Key unit test cases:
- `getLedger`: standard (owed 2000, paid 800 → 1200), prepaid future payables (→ 0), overpaid (→ 0), voided payments excluded, custom referenceDate, fund present but doesn't affect amount_due
- `recordPayment`: inserts with provided date; defaults to today
- `voidPayment`: sets voidedAt; throws NotFoundException (not found); throws BadRequestException (already voided)

**→ git commit**

### Step 2 — Write failing controller tests ✅ COMPLETE
Create `ledgers.controller.spec.ts` and `payments.controller.spec.ts`.
Guard integration tests (real guard + mock JwtService) and endpoint tests (overrideGuard + mock service).

**→ git commit**

### Step 3 — Implement LedgersService ✅ COMPLETE

**→ git commit**

### Step 4 — Implement ContractLedgerController ✅ COMPLETE

**→ git commit**

### Step 5 — Implement PaymentsController + update LedgersModule ✅ COMPLETE

**→ git commit**

### Step 6 — Verify all tests pass (`npm test`) ✅ COMPLETE

All 187 tests pass (45 skipped = integration stubs without DATABASE_URL).

**→ git commit**

### Step 7 — Update progress.txt + CLAUDE.md rules (if learnings), create PR to staging ✅ COMPLETE

**→ git commit → PR**

<promise>COMPLETE</promise>

---

## Verification

```bash
# All tests
npm test --workspace=apps/api

# With real DB (integration tests run)
DATABASE_URL=... npm test --workspace=apps/api

# Manual smoke test
curl -H "Authorization: Bearer <token>" http://localhost:3001/admin/contracts/<id>/ledger
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"amount":"1000","date":"2024-01-15"}' \
  http://localhost:3001/admin/contracts/<id>/payments
curl -X POST -H "Authorization: Bearer <token>" http://localhost:3001/admin/payments/<payment-id>/void
```
