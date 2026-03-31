# Issue 0007 — Manual Test Fixes

## Context
Manual testing of the Kasero admin app revealed multiple bugs and UX issues across the backend and frontend. This plan addresses all findings from `specs/v1/issues/0007-manual-test/issue.md` in dependency order.

---

## Phase 1: Database Migration

**File to create:** `apps/api/drizzle/migrations/0007_profile_void_billing.sql`

```sql
-- Add name/email to admin_users for profile management
ALTER TABLE admin_users ADD COLUMN name text;
ALTER TABLE admin_users ADD COLUMN email text;

-- Add voided contract status (must run outside transaction in Postgres)
ALTER TYPE contract_status ADD VALUE IF NOT EXISTS 'voided';

-- Add billing_date_rule to contracts (day of month when bill is generated)
ALTER TABLE contracts ADD COLUMN billing_date_rule integer;

-- Add billing_date to payables (date when charge appears on ledger)
ALTER TABLE payables ADD COLUMN billing_date date;
```

**File to modify:** `apps/api/src/database/schema.ts`
- `contractStatusEnum`: add `'voided'`
- `contracts`: add `billingDateRule: integer('billing_date_rule')` (nullable)
- `payables`: add `billingDate: date('billing_date')` (nullable)
- `adminUsers`: add `name: text('name')` and `email: text('email')` (both nullable)

---

## Phase 2: Backend — Admin Profile Module

No profile NestJS endpoints exist yet; the profile page returns errors because the backend calls fail.

**Files to create:**
- `apps/api/src/profile/profile.service.ts`
  - `getProfile(userId)` → SELECT id, username, name, email from adminUsers WHERE id = userId
  - `updateProfile(userId, { name?, email? })` → UPDATE adminUsers SET name, email
  - `updatePassword(userId, { currentPassword, newPassword })` → bcryptjs.compare current, hash new, UPDATE passwordHash; throw UnauthorizedException if wrong
- `apps/api/src/profile/profile.controller.ts`
  - `@UseGuards(JwtAuthGuard) @Controller('admin/profile')`
  - `@Get()` → getProfile(req.user.sub)
  - `@Patch()` → updateProfile(req.user.sub, body)
  - `@Patch('password')` → updatePassword(req.user.sub, body)
- `apps/api/src/profile/profile.module.ts` — imports DatabaseModule, declares controller + service

**File to modify:** `apps/api/src/app.module.ts` — add `ProfileModule` to imports array

---

## Phase 3: Backend — Contract Void

**File to modify:** `apps/api/src/contracts/contracts.service.ts`
- Add `async void(id: string)`:
  1. findOne(id); throw BadRequestException if status !== 'posted'
  2. In transaction: set status='voided', updatedAt=now(); insert audit row (entityType='contract', entityId=id, action='void')
  - Import `audit` from schema

**File to modify:** `apps/api/src/contracts/contracts.controller.ts`
- Add `@Post(':id/void') @HttpCode(200)` → contractsService.void(id)

**File to modify:** `apps/api/src/ledgers/ledgers.service.ts`
- In `recordPayment`: fetch the contract row first; throw BadRequestException if contract.status === 'voided'

**Note:** `DashboardService` already filters `WHERE status = 'posted'` — voided contracts automatically show the space as vacant. No dashboard service change needed.

---

## Phase 4: Backend — Billing Date / Due Date Split

**File to modify:** `apps/api/src/contracts/contracts.service.ts`
- `GeneratePayablesParams`: add `billingDateRule?: number`
- `generatePayables()`: compute `billingDate` using `billingDateRule` (same day-of-month clamping as dueDate); include it in returned rows. If billingDateRule is absent, set billingDate = dueDate (backward compat)
- `ContractsService.post()`: pass `existing.billingDateRule` to generatePayables

**File to modify:** `apps/api/src/ledgers/ledgers.service.ts`
- `getLedger`: change `totalOwed` filter from `p.dueDate <= refDate` to `(p.billingDate ?? p.dueDate) <= refDate`

**File to modify:** `apps/api/src/dashboard/dashboard.service.ts`
- `getDashboard`: change `pastDuePayables` filter (line 89) from `p.dueDate <= refDate` to `(p.billingDate ?? p.dueDate) <= refDate` for amount calculation
- Keep dueDate-based logic for nextDueDate and overdue status thresholds (issue says "due date - deadline - should dictate the status")

---

## Phase 5: Backend — Docker Logs / Exception Filter

**File to create:** `apps/api/src/common/all-exceptions.filter.ts`
- `@Catch()` global filter that logs 5xx errors with `Logger.error` (stack trace) and 4xx with `Logger.warn`
- Returns the standard NestJS error response shape

**File to modify:** `apps/api/src/main.ts`
- `app.useGlobalFilters(new AllExceptionsFilter())`

---

## Phase 6: Frontend — Void Contract API Route

**File to create:** `apps/web/app/api/admin/contracts/[id]/void/route.ts`
- Mirror the pattern of the existing `post/route.ts`: POST, forward auth cookie, call `${INTERNAL_API_URL}/admin/contracts/${id}/void`

---

## Phase 7: Frontend — Navigation Cleanup

**File to modify:** `apps/web/app/admin/_components/admin-nav.tsx`
- `NAV_ITEMS`: keep only `{ label: 'Spaces', href: '/admin/spaces' }` and `{ label: 'Tenants', href: '/admin/tenants' }`

**File to modify:** `apps/web/app/admin/(protected)/layout.tsx`
- Make layout `async`; fetch `GET /api/admin/profile` server-side (with auth cookie)
- Replace the static `Kasero / Admin` header block with a link: display the returned name/username as a clickable `<Link href="/admin/profile">` inside the sidebar header area

---

## Phase 8: Frontend — Dashboard → Spaces Merge

The new Spaces page uses dashboard occupancy data and includes CRUD operations.

**File to modify:** `apps/web/app/admin/(protected)/spaces/page.tsx`
- Fetch from both `/admin/dashboard` (occupancy data) and `/admin/spaces` (CRUD operations, for edit form pre-population)
- Pass dashboard entries to a modified `SpacesClient`

**File to modify:** `apps/web/app/admin/(protected)/spaces/_components/spaces-client.tsx`
- Accept `dashboardEntries: DashboardEntry[]` prop (in addition to `spaces: Space[]`)
- Table columns: Space Name (link to detail) | Status badge (overdue/nearing/occupied/vacant) | Tenant | Amount Due | Next Due Date | Actions (Edit, Delete)
- Merge by space ID: use dashboardEntry data for status/tenant/amount columns; use spaces data for Edit/Delete modal operations
- Keep existing modal logic (New Space, Edit Space, Delete confirmation)

**File to modify:** `apps/web/app/admin/login/login-form.tsx`
- Line 26: change `router.push('/admin/dashboard')` → `router.push('/admin/spaces')`

**File to modify:** `apps/web/app/admin/(protected)/dashboard/page.tsx`
- Replace page body with `import { redirect } from 'next/navigation'; export default function DashboardPage() { redirect('/admin/spaces'); }`

---

## Phase 9: Frontend — Space Detail Fixes

**File to modify:** `apps/web/app/admin/(protected)/spaces/[id]/page.tsx`
- Fix back link: `href="/admin/spaces"` and text `← Back to Spaces`
- Sort contracts: posted first, then draft, then voided; then by startDate descending
- Voided contracts: add muted row styling (e.g. `text-slate-400`)

---

## Phase 10: Frontend — Contract Detail Fixes

**File to modify:** `apps/web/app/admin/(protected)/contracts/[id]/page.tsx`
- Remove the redundant server-side "Payments" heading + "No payments." block (lines ~138–144); `ContractDetailClient` already renders the interactive payments table
- Add `billingDate?: string` to the `Payable` interface
- Add "Billing Date" column to the payables table

**File to modify:** `apps/web/app/admin/(protected)/contracts/[id]/_components/contract-detail-client.tsx`
- Default payment date to today: `useState({ amount: '', date: new Date().toISOString().split('T')[0] })`; also reset to today's date after recording payment
- Add "Void Contract" button (only when `isPosted`): show a confirmation modal warning "Voiding prevents future payments and shows the space as Vacant."; on confirm call `POST /api/admin/contracts/${contract.id}/void`; on success `router.refresh()`
- Add `billingDateRule` field to the Edit Contract modal (numeric, 1–31, optional)

---

## Phase 11: Frontend — Standalone Contracts Page

**File to modify:** `apps/web/app/admin/(protected)/contracts/page.tsx`
- Replace page body with `redirect('/admin/spaces')` so direct URL access gracefully navigates to Spaces

---

## Phase 12: Frontend — UI Fixes

**File to modify:** `apps/web/app/admin/(protected)/spaces/_components/spaces-client.tsx`
- Add `text-slate-800` to all `<input>` and `<textarea>` className strings in the New/Edit Space modal (inputs currently lack an explicit text color, making text invisible on some browsers)

**File to modify:** `apps/web/app/api/auth/login/route.ts`
- Replace `secure: process.env.NODE_ENV === 'production'` with `secure: process.env.COOKIE_SECURE === 'true'` (default false). This fixes mobile login where HTTPS may not be present


---

## Phase 13: Github action Fixes

- Check why this error occurs during docker compose build

```
FAIL public-access/public-access.service.spec.ts
  ● PublicAccessService › getPublicStatus › returns contractId and ledger for a valid active code

    NotFoundException: Invalid or expired access code

      14 |     async getPublicStatus(code: string, referenceDate?: string) {
      15 |         const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    > 16 |         if (!UUID_RE.test(code)) throw new NotFoundException('Invalid or expired access code');
         |                                        ^
      17 |
      18 |         const rows = await this.db
      19 |             .select({ contractId: publicAccessCodes.contractId })

      at PublicAccessService.getPublicStatus (public-access/public-access.service.ts:16:40)
      at Object.<anonymous> (public-access/public-access.service.spec.ts:51:42)

  ● PublicAccessService › getPublicStatus › passes referenceDate to getLedger

    NotFoundException: Invalid or expired access code

      14 |     async getPublicStatus(code: string, referenceDate?: string) {
      15 |         const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    > 16 |         if (!UUID_RE.test(code)) throw new NotFoundException('Invalid or expired access code');
         |                                        ^
      17 |
      18 |         const rows = await this.db
      19 |             .select({ contractId: publicAccessCodes.contractId })

      at PublicAccessService.getPublicStatus (public-access/public-access.service.ts:16:40)
      at Object.<anonymous> (public-access/public-access.service.spec.ts:71:27)
```
- Fix the issue


---

## Phase 14 Verification

### Run all tests and make sure there are no issue

### Backend
```bash
cd apps/api
npx tsc --noEmit
```
- Migration 0007 runs without error on `docker compose up`
- `GET /admin/profile` (with JWT) returns `{ id, username, name, email }`
- `PATCH /admin/profile` updates name/email
- `PATCH /admin/profile/password` with wrong password → 401; correct → 200
- `POST /admin/contracts/:id/void` on posted contract → `{ status: 'voided' }`
- `POST /admin/contracts/:id/void` on draft → 400
- After void: `GET /admin/dashboard` shows space as Vacant
- After void: `POST /admin/contracts/:id/payments` → 400
- 500 errors now appear in docker logs with stack traces

### Frontend
```bash
cd apps/web
rm -rf .next
npx tsc --noEmit
npx playwright test
```
- Nav shows only Spaces and Tenants
- Sidebar header has clickable username/profile link
- Login redirects to `/admin/spaces`; `/admin/dashboard` redirects to `/admin/spaces`
- Spaces page shows occupancy status, tenant, amount due + CRUD buttons
- Input text in Space modal is visible (dark text)
- Space detail shows "← Back to Spaces"
- Contracts in space detail are sorted: posted first, then by date desc
- Contract detail has only one Payments section
- Record Payment modal defaults date to today
- Void Contract button on posted contracts; confirmation required
- After voiding, space shows Vacant
- Profile page loads and saves without error
- Mobile: login works without HTTPS cookie restriction
