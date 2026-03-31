# Plan: Issue 0008 — Post Cycle 2

**STATUS:** <promise>COMPLETE</promise>

## Context
Two separate concerns from issue 0008:
1. **Auth bug fixes** — TC-AUTH-006 (expired token) and TC-AUTH-007 (malformed token) FAIL because `proxy.ts` only checks cookie presence, not JWT validity. Users with invalid/expired tokens stay on protected pages seeing empty data instead of being redirected to login.
2. **UI redesign** — Replace the current generic slate-based admin dashboard with "The Precision Architect" design system (per `specs/v1/issues/0008-post-cycle-2/DESIGN.md`): navy/emerald palette, Manrope+Inter typography, no-border tonal layering, emerald-accent buttons, and vertical status bars replacing badge pills.

---

## Phase 1: Fix Auth Token Validation (TC-AUTH-006, TC-AUTH-007)

**Status:** COMPLETE

**Branch:** `fix/issue-0008-auth-token-validation`

**Root cause:**
- `apps/web/proxy.ts` — only checks `if (!token)` → any non-empty cookie value bypasses the guard
- `apps/web/app/admin/(protected)/layout.tsx` — `fetchProfile()` returns `null` on 401 but renders page instead of redirecting

### 1a. `apps/web/proxy.ts`

Add `isJwtValid()` helper (no library; works in Edge Runtime via `atob()`):
- Split by `.`; if not 3 parts → malformed → `false`
- `atob()` decode the middle part (base64url → base64), parse JSON payload
- If `payload.exp` exists and `exp < Date.now() / 1000` → expired → `false`
- Any parse error → `false`

```typescript
function isJwtValid(token: string): boolean {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const payload = JSON.parse(
            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
        );
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false;
        return true;
    } catch { return false; }
}
```

Change the guard from `if (!token)` to `if (!token || !isJwtValid(token.value))`.

### 1b. `apps/web/app/admin/(protected)/layout.tsx`

After `fetchProfile()` returns `null`, redirect to `/admin/login` instead of rendering with a null profile. Use `redirect('/admin/login')` from `next/navigation`.

**Note:** Tests already exist in `apps/web/e2e/sit-cycle2-auth.spec.ts` — TC-AUTH-006 and TC-AUTH-007 are the failing tests. No new test files needed; commit implementation directly.

**Verification:**
```bash
cd apps/web && npx playwright test e2e/sit-cycle2-auth.spec.ts --reporter=list
```

---

## Phase 2: Design Foundation — Colors & Typography

**Branch:** `feat/issue-0008-design-foundation`

### Files:
- `apps/web/app/globals.css` — replace CSS vars with new token palette
- `apps/web/app/layout.tsx` — add Manrope + Inter via `next/font/google`

### Color tokens (CSS variables):
```css
/* Emerald primary */
--primary: #00180e;
--primary-container: #002f1e;
--primary-fixed-dim: #68dba9;
--on-primary-fixed: #002114;

/* Slate secondary */
--secondary-container: #d5e0f8;
--on-secondary-container: #131c2c;

/* Navy tertiary */
--tertiary: #0d1c2e;

/* Surfaces (blue-tinted light) */
--surface: #f8f9ff;
--surface-container-lowest: #ffffff;
--surface-container-low: #f0f2fb;
--surface-container: #e6eeff;
--surface-container-high: #dce1f5;
--surface-container-highest: #d5daf0;

/* Text */
--on-surface: #0d1c2e;
--on-surface-variant: #444c5f;
--outline-variant: #c5c6d2;

/* Error */
--error: #ba1a1a;
--error-container: #ffdad6;
```

### Typography:
- Load `Manrope` (700, 800) and `Inter` (400, 500, 600) via `next/font/google`
- Set Inter as default body font; expose Manrope as `--font-display` CSS variable
- Apply `font-[family-name:var(--font-display)]` on headlines/display text

---

## Phase 3: Layout & Navigation

**Branch:** `feat/issue-0008-design-layout`

### Files:
- `apps/web/app/admin/(protected)/layout.tsx` — sidebar
- `apps/web/app/admin/_components/admin-nav.tsx` — nav links

### Changes:
- Sidebar bg: `bg-[var(--surface-container-highest)]` (replaces slate-900)
- Remove `border-r` between sidebar and main content area
- Main content bg: `bg-[var(--surface)]`
- Nav links: navy text `text-[var(--on-surface)]`; active: `bg-[var(--surface-container)]`
- Profile/branding header: emerald accent strip or navy gradient `from-[var(--primary)] to-[var(--primary-container)]`
- Logout: ghost style — no bg, `text-[var(--on-surface-variant)]`

---

## Phase 4: Interactive Components — Buttons, Inputs, Modals

**Branch:** `feat/issue-0008-design-components`

### Files: All `_components/*.tsx` files with forms/buttons

### Button patterns:
- **Primary (action):** `bg-[var(--primary-fixed-dim)] text-[var(--on-primary-fixed)] rounded-md hover:opacity-90`
- **Secondary:** `bg-[var(--secondary-container)] text-[var(--on-secondary-container)] rounded-md`
- **Ghost/tertiary:** `text-[var(--on-surface-variant)] bg-transparent hover:bg-[var(--surface-container-low)]`
- **Danger:** `text-[var(--error)] bg-[var(--error-container)] rounded-md`

### Input fields:
- Background: `bg-[var(--surface-container-highest)]`
- Border: ghost border `border border-[var(--outline-variant)]/15` → focus `ring-2 ring-[var(--primary-fixed-dim)]`
- No `border-slate-300` anywhere

### Modal styles:
- Container: `bg-[var(--surface-container-lowest)]` (white)
- Shadow: `shadow-[0_10px_40px_rgba(13,28,46,0.06)]`
- No `border-b border-slate-200` header divider — use padding/font contrast only

---

## Phase 5: Tables & Status Indicators

**Branch:** `feat/issue-0008-design-tables`

### Files:
- `apps/web/app/admin/(protected)/spaces/_components/spaces-client.tsx`
- `apps/web/app/admin/(protected)/tenants/_components/tenants-client.tsx`
- `apps/web/app/admin/(protected)/contracts/_components/contracts-client.tsx`
- `apps/web/app/admin/(protected)/contracts/[id]/_components/contract-detail-client.tsx`

### Table changes:
- Remove `border border-slate-200` wrapper and `border-b border-slate-100` row dividers
- Even rows: `bg-[var(--surface-container-lowest)]`; odd rows or hover: `bg-[var(--surface-container-low)]`
- Header: `bg-[var(--surface-container)]` with Manrope uppercase labels `font-[family-name:var(--font-display)]`
- Cell padding: increase to `px-5 py-4` (breathing room)

### Status indicator (Spaces page — replace pill badges):
Replace `bg-red-100 text-red-800 px-2 py-0.5 rounded` pills with a vertical status bar to the left of the space name:
```tsx
<span className="w-1 h-5 rounded-sm mr-3 inline-block" style={{ background: statusColor }} />
```
- `overdue` → `var(--error)` (red)
- `nearing` → `#b45309` (amber)
- `occupied` → `var(--primary-fixed-dim)` (emerald)
- `vacant` → `var(--outline-variant)` (gray)

---

## Phase 6: Login Page & Final Polish

**Branch:** `feat/issue-0008-design-polish`

### Files:
- `apps/web/app/admin/login/login-form.tsx`
- `apps/web/app/admin/login/page.tsx`
- `apps/web/app/admin/(protected)/profile/page.tsx`
- `apps/web/app/admin/(protected)/contracts/[id]/page.tsx` (Amount Due section)

### Login page:
- Page bg: `bg-[var(--surface)]`
- Card: `bg-[var(--surface-container-lowest)]` with ambient shadow `shadow-[0_10px_40px_rgba(13,28,46,0.06)]`
- "Kasero" headline: Manrope `text-3xl font-bold text-[var(--tertiary)]`
- Inputs and button: new styles from Phase 4

### Profile page:
- Section cards: tonal surfaces, no `border` lines
- Section headers: Manrope font

### Contract detail:
- Amount Due card: ambient shadow, no border; overdue color → `var(--error)`, paid → `var(--primary-fixed-dim)`

---

## Phase 7: Unblock Blocked Tests

**Branch:** `fix/issue-0008-unblock-blocked-tests`

### How tests are structured
- Dashboard/public blocked tests run against the **mock server** (global-setup.ts), not Docker
- `global-setup.ts` starts an in-memory HTTP server on port 3099; `INTERNAL_API_URL` env var points the Next.js dev server to this mock server
- `FIXTURES` is a static in-memory map of endpoint → response data

### TC-DASH-004: All Spaces Overdue

**Current state:** `test.skip()` (always skipped) — static fixture only has 1 overdue space

**Fix:**
- In `global-setup.ts`: add a second fixture for the dashboard with all 4 spaces having `occupancyStatus: 'overdue'` and `amountDue > 0`
- Update the test to navigate to the dashboard when the mock returns all-overdue data
- Simpler approach: add a separate mock route override in the test using a unique query param that triggers the all-overdue dataset
- Remove `test.skip()` once fixture is in place

**Fixture data needed:** 4 space entries, all with `{ occupancyStatus: 'overdue', amountDue: '2000.00', nextDueDate: '...' }`

---

### TC-DASH-005: All Spaces Vacant

**Status: Accept as permanently blocked (v1)**

DB trigger prevents hard-delete of contracts; existing spaces have posted contracts; no path to "all vacant" without a reset. Keep `test.skip()` with updated comment: "ACCEPTED BLOCKED — DB constraint prevents achieving all-vacant state in v1."

---

### TC-DASH-007: Dashboard with 50+ Spaces

**Current state:** `test.skip()` (always skipped) — static fixture only has 4 spaces

**Fix:**
- In `global-setup.ts`: generate 55 space objects dynamically:
  ```typescript
  const largeSpaceList = Array.from({ length: 55 }, (_, i) => ({
      id: `space-bulk-${i + 1}`,
      name: `Unit ${i + 1}`,
      occupancyStatus: i % 4 === 0 ? 'overdue' : i % 4 === 1 ? 'nearing' : i % 4 === 2 ? 'occupied' : 'vacant',
      amountDue: i % 4 === 0 ? '1000.00' : '0.00',
      nextDueDate: '2026-04-15',
  }));
  FIXTURES['/admin/dashboard-large'] = largeSpaceList;
  ```
- Add handler in mock server for `/admin/dashboard-large`
- In the test: use a query param or route override to serve the large list; verify 50+ rows render without crash
- Remove `test.skip()` once fixture is in place

---

### TC-PUBLIC-007: Rapid Repeated Access

**Current state:** `test.skip(isDockerMode, ...)` — skipped only in Docker mode

**Fix:**
- Fixture `/internal/contracts/public/VALIDCODE` already exists in global-setup.ts
- Test navigates to `/public/VALIDCODE` 10+ times concurrently; expects data to load each time
- In mock mode (no Docker), this should already work
- Ensure mock mode test passes; keep Docker skip with clear comment

---

### TC-PUBLIC-009: Tenant Self-Entry Duplicate Submission

**Current state:** `test.skip(isDockerMode, ...)` — skipped only in Docker mode

**Fix:**
- Fixture `VALIDTOKEN` and `USEDTOKEN` exist; problem is mock server token POST handler is stateless
- Fix in `global-setup.ts`: add in-memory `usedTokens = new Set()` state so first submission succeeds (200) and repeat returns 410
- Ensure the test passes in mock mode; keep Docker skip with clear comment

---

### TC-PUBLIC-010: Self-Entry with Incomplete Data

**Current state:** `test.skip(isDockerMode, ...)` — skipped only in Docker mode

**Fix:**
- Fixture `VALIDTOKEN` exists; test validates **client-side form validation only**
- Navigate to `/entry/VALIDTOKEN`; attempt submit without required fields; expect frontend validation errors
- Ensure mock-mode test passes; keep Docker skip with clear comment

## Phase 7 - Fix error during docker build

```
FAIL src/contracts/contracts.service.spec.ts
  ● generatePayables › annually from Feb 29 (leap year) → non-leap year clamped to Feb 28

    expect(received).toMatchObject(expected)

    - Expected  - 1
    + Received  + 1

      Object {
        "dueDate": "2024-02-29",
    -   "periodEnd": "2025-02-27",
    +   "periodEnd": "2025-01-31",
        "periodStart": "2024-02-29",
      }

      140 |         // 2024: leap year, starts Feb 29
      141 |         // Next period starts Feb 28, 2025 (clamped), so periodEnd = Feb 27, 2025
    > 142 |         expect(rows[0]).toMatchObject({ periodStart: '2024-02-29', periodEnd: '2025-02-27', dueDate: '2024-02-29' });
          |                         ^
      143 |         // 2025: non-leap year, starts Feb 28
      144 |         // Next period starts Feb 28, 2026, so periodEnd = Feb 27, 2026
      145 |         expect(rows[1]).toMatchObject({ periodStart: '2025-02-28', periodEnd: '2026-02-27', dueDate: '2025-02-28' });

      at Object.<anonymous> (contracts/contracts.service.spec.ts:142:25)
```
## Phase 8 - Verification

### Run test scripts

```bash
# Unit tests (all phases — run from repo root)
npm test

# Playwright auth tests (Phase 1)
cd apps/web && npx playwright test e2e/sit-cycle2-auth.spec.ts --reporter=list

# Playwright full regression (Phases 2–6)
cd apps/web && npx playwright test e2e/ --reporter=list

# Playwright blocked tests unblocked (Phase 7 — run in mock mode: no Docker stack)
cd apps/web && npx playwright test e2e/sit-cycle2-dashboard.spec.ts e2e/sit-public.spec.ts --reporter=list
```

### Test thru actual UI

Each phase must have: implementation commit → full test suite pass → memory md update commit → PR to staging opened before starting the next phase.


---

## Critical Files

| Phase | Files |
|-------|-------|
| 1 | `apps/web/proxy.ts`, `apps/web/app/admin/(protected)/layout.tsx` |
| 2 | `apps/web/app/globals.css`, `apps/web/app/layout.tsx` |
| 3 | `apps/web/app/admin/(protected)/layout.tsx`, `apps/web/app/admin/_components/admin-nav.tsx` |
| 4 | All `_components/*.tsx` with buttons/inputs/modals |
| 5 | All `_components/*.tsx` with tables + spaces-client.tsx (status bars) |
| 6 | `apps/web/app/admin/login/login-form.tsx`, `profile/page.tsx`, `contracts/[id]/page.tsx` |
| 7 | `apps/web/e2e/global-setup.ts`, `apps/web/e2e/sit-cycle2-dashboard.spec.ts`, `apps/web/e2e/sit-public.spec.ts` |

---

