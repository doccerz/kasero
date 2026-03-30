# Plan: Fix Post-QA Cycle-1 Issues (issue-0006)

## Context

QA Cycle 1 produced 2 FAIL results and 20+ BLOCKED results. This plan fixes the FAILs and implements the missing contract management UI that is the root cause of nearly all BLOCKED test cases. Also fixes a Docker startup regression that makes the app inaccessible.

---

## Group A — Bug Fixes ✅ COMPLETE

### A1. Fix Docker blank page on `docker compose up` ✅

**Root cause**: `Dockerfile` CMD for the `web-runner` stage references `apps/web/server.js`, but Next.js standalone output always places `server.js` at the **root** of the `.next/standalone/` directory. After `COPY --from=web-builder /app/apps/web/.next/standalone ./`, the entry point lands at `/app/server.js`, not `/app/apps/web/server.js`. The container crashes silently on start.

**File**: `Dockerfile`
**Change**: Line 31
```diff
-CMD ["node", "apps/web/server.js"]
+CMD ["node", "server.js"]
```

> Static/public COPY paths on lines 28–29 are already correct — they land at `/app/apps/web/.next/static` and `/app/apps/web/public`, which `server.js` resolves via its compile-time `__dirname` references.

---

### A2. Fix TC-PUBLIC-002 — Backend returns 500 for invalid public access code ✅

**Root cause**: `publicAccessCodes.code` column is declared as `uuid` type in the Drizzle schema. When the URL slug is a non-UUID string (e.g., `this-code-does-not-exist-at-all`), PostgreSQL throws `invalid input syntax for type uuid` — an unhandled DB error → HTTP 500 instead of 404.

**File**: `apps/api/src/public-access/public-access.service.ts`
**Change**: Add UUID format guard at the top of `getPublicStatus()` before the DB query:
```typescript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!UUID_RE.test(code)) throw new NotFoundException('Invalid or expired access code');
```

---

### A3. Fix TC-SPACE-003 — Ambiguous Playwright locator

**Root cause**: `page.getByText(/contracts/i)` matches 3 elements in Playwright strict mode: the nav link "Contracts", the `<h2>Contracts</h2>` section heading, and the "No contracts for this space." text. Fix per AGENTS.md guidance.

**Files**:
- `apps/web/e2e/sit-spaces.spec.ts` — line 80
- `specs/v1/qa/cycle-1/sit-spaces.spec.ts` — canonical copy, same line

**Change**:
```diff
-await expect(page.getByText(/contracts/i)).toBeVisible();
+await expect(page.getByRole('heading', { name: /contracts/i })).toBeVisible();
```

---

## Group B — Contract Management UI ✅ COMPLETE (unblocks all CONTRACT / LEDGER / PAYMENT / PUBLIC / INTEGRITY / TENANT / DASH blocked tests)

### Architecture: follow the established Spaces pattern

Each feature area uses: `page.tsx` (server, fetches data) → `_components/feature-client.tsx` (client, CRUD interactions).

---

### B1. New Next.js API proxy routes

All follow the same proxy pattern as `apps/web/app/api/admin/spaces/[id]/route.ts` — read auth cookie, forward to `INTERNAL_API_URL`, propagate status codes.

| File | Method | Forwards to |
|------|--------|-------------|
| `apps/web/app/api/admin/contracts/route.ts` | POST | `POST /admin/contracts` |
| `apps/web/app/api/admin/contracts/[id]/route.ts` | PATCH | `PATCH /admin/contracts/:id` |
| `apps/web/app/api/admin/contracts/[id]/post/route.ts` | POST | `POST /admin/contracts/:id/post` |
| `apps/web/app/api/admin/contracts/[id]/payments/route.ts` | POST | `POST /admin/contracts/:id/payments` |
| `apps/web/app/api/admin/payments/[id]/void/route.ts` | POST | `POST /admin/payments/:id/void` |

---

### B2. Contracts list page — add "New Contract" button

**File**: `apps/web/app/admin/(protected)/contracts/page.tsx`
Convert from pure server render to server + client split:
- Server component fetches: contracts list, all active tenants, all non-deleted spaces
- Passes data to `<ContractsClient contracts={...} tenants={...} spaces={...} />`

**New file**: `apps/web/app/admin/(protected)/contracts/_components/contracts-client.tsx`
Client component (follow `spaces-client.tsx` pattern):
- Renders the existing contracts table
- "New Contract" button (triggers creation modal)
- Creation modal form fields:
  - Tenant (select from tenants list) — required
  - Space (select from spaces list) — required
  - Start Date (date) — required
  - End Date (date) — required
  - Rent Amount (number) — required
  - Billing Frequency (select: monthly / quarterly / annually) — required
  - Due Date Rule (number 1–31, day of month) — required
  - Deposit Amount (number) — optional
  - Advance Months (number) — optional
- On submit: `POST /api/admin/contracts` → close modal → `router.refresh()`

---

### B3. Contract detail page — add Post / Edit / Record Payment / Void actions

**File**: `apps/web/app/admin/(protected)/contracts/[id]/page.tsx`
Server component passes `contract` and `ledger` (already fetched) to a new client component:
```tsx
<ContractDetailClient contract={contract} ledger={ledger} />
```

**New file**: `apps/web/app/admin/(protected)/contracts/[id]/_components/contract-detail-client.tsx`
Client component renders action buttons based on `contract.status`:

- **Draft status only:**
  - "Edit Contract" button → edit modal (same fields as creation form, pre-populated)
    - On submit: `PATCH /api/admin/contracts/:id` → `router.refresh()`
  - "Post Contract" button → inline confirmation ("Are you sure?")
    - On confirm: `POST /api/admin/contracts/:id/post` → `router.refresh()`

- **Posted status only:**
  - "Record Payment" button → payment modal (amount, date fields)
    - On submit: `POST /api/admin/contracts/:id/payments` → `router.refresh()`
  - Per non-voided payment row: "Void" button
    - On click: `POST /api/admin/payments/:id/void` → `router.refresh()`

The read-only contract summary, payables, payments and fund tables remain in the server component for SSR.

---


## Files Modified / Created

### Modified
| File | Change |
|------|--------|
| `Dockerfile` | Fix CMD entry point |
| `apps/api/src/public-access/public-access.service.ts` | UUID guard before DB query |
| `apps/web/e2e/sit-spaces.spec.ts` | Fix ambiguous locator (line 80) |
| `specs/v1/qa/cycle-1/sit-spaces.spec.ts` | Same locator fix (canonical copy) |
| `apps/web/app/admin/(protected)/contracts/page.tsx` | Delegate to ContractsClient |
| `apps/web/app/admin/(protected)/contracts/[id]/page.tsx` | Delegate actions to ContractDetailClient |

### Created
| File | Purpose |
|------|---------|
| `apps/web/app/api/admin/contracts/route.ts` | POST create contract proxy |
| `apps/web/app/api/admin/contracts/[id]/route.ts` | PATCH update contract proxy |
| `apps/web/app/api/admin/contracts/[id]/post/route.ts` | POST post-contract proxy |
| `apps/web/app/api/admin/contracts/[id]/payments/route.ts` | POST record payment proxy |
| `apps/web/app/api/admin/payments/[id]/void/route.ts` | POST void payment proxy |
| `apps/web/app/admin/(protected)/contracts/_components/contracts-client.tsx` | CRUD client for contracts list |
| `apps/web/app/admin/(protected)/contracts/[id]/_components/contract-detail-client.tsx` | Action client for contract detail |

---

## Verification

1. **Docker**: `docker compose up -d --build` → `localhost:3000` must render the public home page (not blank)
2. **TC-PUBLIC-002**: `docker logs web` must show no crash; navigate to `/public/not-a-uuid` → page shows "Invalid or expired access code."
3. **TC-SPACE-003**: Run `npx playwright test sit-spaces.spec.ts` → TC-SPACE-003 passes
4. **TC-CONTRACT-001**: Navigate to `/admin/contracts` → "New Contract" button visible → clicking opens modal
5. **TC-CONTRACT-003**: Create a draft contract → "Post Contract" button on detail page → status changes to "posted"
6. **TC-PAYMENT-001**: On a posted contract → "Record Payment" → payment appears in payments table
7. **TC-PAYMENT-003**: Click "Void" on a payment → row shows as voided
8. **TypeScript**: `npx tsc --noEmit` in `apps/web` passes with no errors

---

## Git Workflow

Branch: `fix/post-qa-cycle-1` (new branch off current `feat/frontend-ui-e2e`)
Commit after each group (A: fixes, B: contract UI).
Open PR against `main` when complete.
