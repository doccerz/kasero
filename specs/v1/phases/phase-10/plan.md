# Phase 10 — Dashboard & Admin Operational Views

## Context

Phase 8 completed the atomic contract posting flow (backend). Phase 10 delivers the first real admin UI: a dashboard showing all spaces sorted by urgency, a space detail view with contract history, and a contract ledger view. All admin pages are currently placeholder stubs returning `<main>Text</main>`. The NestJS API has all ledger/contract/space endpoints in place but lacks a dedicated dashboard aggregation endpoint.

---

## Branch

```bash
git checkout -b feat/phase-10-dashboard-and-admin-operational-views
```

---

## Architecture

### New backend module: `DashboardModule`

`GET /admin/dashboard` (JWT-guarded) returns an array of space entries sorted by urgency:

```
overdue → nearing (due within 7 days) → occupied → vacant
```

Each entry shape:
```typescript
{
    id, name, description?,
    occupancyStatus: 'overdue' | 'nearing' | 'occupied' | 'vacant',
    tenantId?, tenantName?, contractId?,
    amountDue?,     // '0.00' string, undefined when vacant
    nextDueDate?,   // earliest upcoming payable dueDate, undefined when vacant
}
```

"Overdue" = posted contract AND `amount_due > 0` AND at least one payable with `dueDate <= today`.
"Nearing" = posted contract AND `amount_due == 0` AND next `dueDate <= today + 7 days`.
"Occupied" = posted contract, neither overdue nor nearing.
"Vacant" = no posted contract for this space.

**Query strategy** (3 round-trips, all parallel where possible):
1. `SELECT * FROM spaces WHERE deleted_at IS NULL`
2. `SELECT contracts.*, firstName || ' ' || lastName AS tenantName FROM contracts LEFT JOIN tenants WHERE status = 'posted'`
3. Bulk `SELECT * FROM payables WHERE contract_id IN (...)` + `SELECT * FROM payments WHERE contract_id IN (...)`  — **skipped entirely when no posted contracts exist** (guards against `IN ()` SQL error)

Amount-due math is identical to `LedgersService`: filter payables by `dueDate <= refDate`, sum non-voided payments, clamp to 0.

### Frontend pages (server components, Next.js 16.2.1 patterns)

All three pages are `async` server components. Key breaking-change rules:
- `params` is a `Promise` → always `const { id } = await params`
- `cookies()` is async → `await cookies()`
- `fetch(url, { cache: 'no-store' })` + `Authorization: Bearer <token>` header

---

## Task Sequence (TDD)

### 1. ✅ Write failing tests → commit

**`apps/api/src/dashboard/dashboard.service.spec.ts`** (new file)

Mock DB uses 4 sequential `mockReturnValueOnce` for `select()`:
- call 1: spaces (returns via `from → where`)
- call 2: contracts with join (returns via `from → leftJoin → where`)
- call 3: payables bulk (returns via `from → where`)
- call 4: payments bulk (returns via `from → where`)

For vacant-only tests, calls 3 & 4 are never made — mock only needs 2 slots.

**Test cases:**

| # | Scenario | Expected status |
|---|----------|----------------|
| 1 | No spaces, no contracts | `[]` |
| 2 | Space with no posted contract | `vacant` |
| 3 | Paid-up, next due > 7 days | `occupied` |
| 4 | Past-due payable AND amount_due > 0 | `overdue`, `amountDue` populated |
| 5 | Paid up, next due ≤ 7 days | `nearing`, `nextDueDate` populated |
| 6 | All four statuses → sort order | overdue[0], nearing[1], occupied[2], vacant[3] |
| 7 | Past-due payable but fully paid → amount_due = 0 | `occupied` (NOT overdue) |
| 8 | Voided payment excluded from totalPaid | correct `amountDue` |
| 9 | Multiple payables → `nextDueDate` = earliest upcoming | string comparison |
| 10 | `amountDue` undefined for vacant spaces | `undefined` |

### 2. ✅ Implement service, controller, module → commit

**`apps/api/src/dashboard/dashboard.service.ts`** (new)
- `getDashboard(referenceDate?: string): Promise<DashboardEntry[]>`
- Imports: `isNull`, `inArray`, `getTableColumns`, `sql`, `eq` from `drizzle-orm`
- Tables: `spaces`, `contracts`, `tenants`, `payables`, `payments`

**`apps/api/src/dashboard/dashboard.controller.ts`** (new)
```typescript
@UseGuards(JwtAuthGuard)
@Controller('admin/dashboard')
export class DashboardController {
    @Get()
    getDashboard(@Query('referenceDate') referenceDate?: string) { ... }
}
```

**`apps/api/src/dashboard/dashboard.module.ts`** (new)
```typescript
@Module({ imports: [AuthModule], providers: [DashboardService], controllers: [DashboardController] })
```

**`apps/api/src/app.module.ts`** (modify)
- Add `DashboardModule` to the imports array alongside existing modules

### 3. ✅ Verify all API tests pass → commit

```bash
npm test --workspace=apps/api
```

### 4. ✅ Frontend: Dashboard page → commit

**`apps/web/app/admin/dashboard/page.tsx`** (replace stub)
- `async` server component
- Reads `auth_token` cookie, fetches `GET /admin/dashboard`
- Renders space list grouped visually by status badge
- Each entry links to `/admin/spaces/:id`
- Columns: Space Name | Status | Tenant | Amount Due | Next Due Date

### 5. ✅ Frontend: Space detail page → commit

**`apps/web/app/admin/spaces/[id]/page.tsx`** (replace stub)
- `await params` to get `id`
- Parallel fetch: `GET /admin/spaces/:id` + `GET /admin/contracts`
- Filter contracts by `spaceId === id` in component
- Active (posted) contract highlighted (bold row or distinct style)
- Each contract row links to `/admin/contracts/:id`
- Columns: Tenant | Start | End | Status | Link

### 6. ✅ Frontend: Contract ledger page → commit

**`apps/web/app/admin/contracts/[id]/page.tsx`** (replace stub)
- `await params` to get `id`
- Parallel fetch: `GET /admin/contracts/:id` + `GET /admin/contracts/:id/ledger`
- Contract summary header: tenant, space, period, rent amount, billing frequency
- **Amount Due** section — displayed prominently at top
- Payables table: Period Start | Period End | Due Date | Amount
- Payments table: Date | Amount | Voided (voided rows visually struck-through)
- Fund table: Type | Amount

### 7. ✅ Verify full test suite passes → commit

```bash
npm test --workspace=apps/api
npm test --workspace=apps/web
```

### 8. ✅ Update CLAUDE.md → commit

### 9. ✅ Create PR to staging

---

## Critical Files

| File | Action |
|------|--------|
| `apps/api/src/dashboard/dashboard.service.spec.ts` | CREATE (tests first) |
| `apps/api/src/dashboard/dashboard.service.ts` | CREATE |
| `apps/api/src/dashboard/dashboard.controller.ts` | CREATE |
| `apps/api/src/dashboard/dashboard.module.ts` | CREATE |
| `apps/api/src/app.module.ts` | MODIFY (add DashboardModule) |
| `apps/web/app/admin/dashboard/page.tsx` | MODIFY (replace stub) |
| `apps/web/app/admin/spaces/[id]/page.tsx` | MODIFY (replace stub) |
| `apps/web/app/admin/contracts/[id]/page.tsx` | MODIFY (replace stub) |

## Reuse

- `LedgersService` amount-due JS logic pattern (re-implement inline in DashboardService — same 5-line math, no extraction needed)
- `ContractsService.findAll()` leftJoin pattern for `tenantName` computed column (`getTableColumns` + `sql` template)
- Existing `buildMockDb` / `mockReturnValueOnce` pattern from `testing-patterns.md`
- `AdminLayout` `auth_token` cookie pattern → replicate in each page's `await cookies()`

## Verification

```bash
# Run API tests (dashboard service unit tests)
npm test --workspace=apps/api

# Run web tests
npm test --workspace=apps/web

# Manual smoke test (requires local DB + running API):
# 1. POST /admin/auth/login → get token
# 2. GET /admin/dashboard → check space entries + sort order
# 3. Navigate /admin/spaces/:id → verify contracts table
# 4. Navigate /admin/contracts/:id → verify ledger, payables, payments, fund
```

<promise>COMPLETE</promise>
